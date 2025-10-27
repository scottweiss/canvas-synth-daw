import { ADSR } from '../audio/ADSR';
import midiToFrequency from '../midi/midi-to-frequency';
import { SynthVoice } from './SynthVoice';
import { Reverb, Delay } from './Effects';
import { createSynthPatch, SynthPatch, SynthPatchState } from './SynthPatch';
import { FilterPatch, MasterPatch, ModulationPatch, OscillatorPatch } from './SynthPatch';
import { TrackAudioNode } from './TrackAudioNode';
import { TrackManager } from './TrackManager';

export class AudioEngine {
  private static instance: AudioEngine;
  private analyserNode: AnalyserNode;
  private dataArray: Uint8Array;
  public audioContext: AudioContext;
  #bpm: number;

  // Voice management
  private voicePool: SynthVoice[] = [];
  private activeVoices: Map<number, SynthVoice> = new Map();
  private maxVoices: number = 8;

  // Master chain
  private masterGain: GainNode;
  private masterCompressor: DynamicsCompressorNode;
  private masterReverb: Reverb;
  private masterDelay: Delay;

  // Per-track audio nodes
  private trackAudioNodes: Map<string, TrackAudioNode> = new Map();
  private trackManager: TrackManager;
  private currentTrackId: string | null = null;

  private constructor() {
    this.audioContext = new window.AudioContext();
    this.analyserNode = this.audioContext.createAnalyser();
    this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.#bpm = 120;

    // Setup master chain
    this.masterGain = this.audioContext.createGain();
    this.masterCompressor = this.audioContext.createDynamicsCompressor();
    this.masterReverb = new Reverb(this.audioContext);
    this.masterDelay = new Delay(this.audioContext);

    // Connect master chain
    this.masterGain.connect(this.masterCompressor);
    this.masterCompressor.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);

    // Initialize track manager
    this.trackManager = TrackManager.getInstance();

    // Initialize voice pool (don't connect yet - will connect when track is set)
    for (let i = 0; i < this.maxVoices; i++) {
      const voice = new SynthVoice(this.audioContext);
      voice.connect(this.masterReverb.getInput());
      voice.connect(this.masterDelay.getInput());
      this.voicePool.push(voice);
    }

    // Connect effects
    this.masterReverb.connect(this.masterGain);
    this.masterDelay.connect(this.masterGain);

    this.masterGain.gain.value = 0.75; // Default master volume

    // Set up default track routing and subscribe to track changes
    this.initializeDefaultTrackRouting();

    // Subscribe to track selection changes
    this.trackManager.on('trackSelected', this.handleTrackSelected.bind(this));
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

  applyADSR(gainNode: GainNode): void {
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
      currentTime + adsr.attack
    );
    gainNode.gain.linearRampToValueAtTime(
      adsr.sustain * maxVolumne,
      currentTime + adsr.attack + adsr.decay
    );
    gainNode.gain.setValueAtTime(
      adsr.sustain * maxVolumne,
      currentTime + adsr.attack + adsr.decay
    );
  }

  releaseEnvelope(gainNode: GainNode): void {
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

  getAvailableVoice(): SynthVoice | null {
    // Find a voice that's not currently playing
    for (const voice of this.voicePool) {
      if (![...this.activeVoices.values()].includes(voice)) {
        return voice;
      }
    }

    // If all voices are active, steal the oldest one
    if (this.activeVoices.size > 0) {
      const [oldestNote] = this.activeVoices.keys();
      const voice = this.activeVoices.get(oldestNote)!;
      voice.noteOff();
      this.activeVoices.delete(oldestNote);
      return voice;
    }

    return null;
  }

  noteOn(midiNote: number, velocity: number = 100): void {
    const voice = this.getAvailableVoice();
    if (!voice) return;

    // Apply the currently selected track's patch before playing
    const currentTrack = this.trackManager.getSelectedTrack();
    if (currentTrack) {
      voice.applyPatch(currentTrack.patch.getState());
    }

    voice.noteOn(midiNote, velocity);
    this.activeVoices.set(midiNote, voice);
  }

  // Play a note using a specific track's patch (for multi-track playback)
  noteOnWithTrack(trackId: string, midiNote: number, velocity: number = 100): void {
    const track = this.trackManager.getTrack(trackId);
    if (!track) return;

    const voice = this.getAvailableVoice();
    if (!voice) return;

    // Apply this track's patch to the voice before playing
    voice.applyPatch(track.patch.getState());

    voice.noteOn(midiNote, velocity);
    // Use a composite key to track which voice is playing for which track
    const key = midiNote * 1000 + parseInt(trackId.slice(-3), 36);
    this.activeVoices.set(key, voice);
  }

  noteOff(midiNote: number): void {
    const voice = this.activeVoices.get(midiNote);
    if (voice) {
      voice.noteOff();
      this.activeVoices.delete(midiNote);
    }
  }

  // Stop a note that was started with noteOnWithTrack
  noteOffWithTrack(trackId: string, midiNote: number): void {
    const key = midiNote * 1000 + parseInt(trackId.slice(-3), 36);
    const voice = this.activeVoices.get(key);
    if (voice) {
      voice.noteOff();
      this.activeVoices.delete(key);
    }
  }

  // Stop all currently playing notes
  stopAllNotes(): void {
    this.activeVoices.forEach((voice) => {
      voice.noteOff();
    });
    this.activeVoices.clear();
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = volume;
  }

  getMasterInput(): GainNode {
    return this.masterGain;
  }

  getPatch(): SynthPatch | null {
    const track = this.trackManager.getSelectedTrack();
    return track ? track.patch : null;
  }

  // Note: Patch update methods are no longer needed here.
  // The device chain directly updates the selected track's patch.

  getMasterReverb(): Reverb {
    return this.masterReverb;
  }

  getMasterDelay(): Delay {
    return this.masterDelay;
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  // Track the current patch listeners so we can unsubscribe when switching tracks
  private currentPatchListeners: Map<string, Function> = new Map();

  private subscribeToTrackPatch(trackPatch: SynthPatch): void {
    // Unsubscribe from previous patch if any
    this.unsubscribeFromCurrentPatch();

    // NOTE: We no longer update oscillator, filter, and modulation settings in real-time
    // for all voices. Instead, these settings are applied per-voice at note-on time.
    // This ensures proper isolation between tracks - each track maintains its own
    // synth settings, and changing Track A's parameters won't affect Track B's playing notes.

    // Subscribe to effects changes (these are master/global effects)
    const effectsListener = (effects: any) => {
      this.masterReverb.setMix(effects.reverbMix);
      this.masterDelay.setMix(effects.delayMix);
      this.masterDelay.setTime(effects.delayTime);
      this.masterDelay.setFeedback(effects.delayFeedback);
    };
    trackPatch.on('effects', effectsListener);
    this.currentPatchListeners.set('effects', effectsListener);

    // Subscribe to envelope changes (ADSR is a global singleton)
    const envelopeListener = (adsr: any) => {
      ADSR.getInstance().adsr = adsr;
    };
    trackPatch.on('envelope', envelopeListener);
    this.currentPatchListeners.set('envelope', envelopeListener);
  }

  private unsubscribeFromCurrentPatch(): void {
    const track = this.trackManager.getSelectedTrack();
    if (track && this.currentPatchListeners.size > 0) {
      this.currentPatchListeners.forEach((listener, event) => {
        track.patch.off(event, listener);
      });
      this.currentPatchListeners.clear();
    }
  }

  private applyPatchSnapshot(patch: SynthPatchState): void {
    // Only apply global/master settings when switching tracks.
    // Per-voice settings (oscillators, filters, modulation) are applied at note-on time.
    // This ensures proper track isolation - Track A's settings don't affect Track B.

    // Apply master effects (global)
    this.masterReverb.setMix(patch.effects.reverbMix);
    this.masterDelay.setMix(patch.effects.delayMix);
    this.masterDelay.setTime(patch.effects.delayTime);
    this.masterDelay.setFeedback(patch.effects.delayFeedback);

    // Apply envelope (global ADSR singleton)
    ADSR.getInstance().adsr = patch.envelope;
  }

  // Track audio node management
  createTrackAudioNode(trackId: string): TrackAudioNode {
    if (this.trackAudioNodes.has(trackId)) {
      return this.trackAudioNodes.get(trackId)!;
    }

    const trackNode = new TrackAudioNode(this.audioContext, trackId);
    trackNode.connectOutput(this.masterGain);
    this.trackAudioNodes.set(trackId, trackNode);
    return trackNode;
  }

  removeTrackAudioNode(trackId: string): void {
    const trackNode = this.trackAudioNodes.get(trackId);
    if (trackNode) {
      trackNode.disconnect();
      this.trackAudioNodes.delete(trackId);
    }
  }

  getTrackAudioNode(trackId: string): TrackAudioNode | undefined {
    return this.trackAudioNodes.get(trackId);
  }

  setTrackVolume(trackId: string, volume: number): void {
    const trackNode = this.trackAudioNodes.get(trackId);
    if (trackNode) {
      trackNode.setVolume(volume);
    }
  }

  setTrackPan(trackId: string, pan: number): void {
    const trackNode = this.trackAudioNodes.get(trackId);
    if (trackNode) {
      trackNode.setPan(pan);
    }
  }

  setTrackMute(trackId: string, muted: boolean): void {
    const trackNode = this.trackAudioNodes.get(trackId);
    if (trackNode) {
      trackNode.setMute(muted);
    }
  }

  setTrackSolo(trackId: string, solo: boolean): void {
    const trackNode = this.trackAudioNodes.get(trackId);
    if (trackNode) {
      trackNode.setSolo(solo);
    }
  }

  getTrackPeakLevel(trackId: string): number {
    const trackNode = this.trackAudioNodes.get(trackId);
    return trackNode ? trackNode.getPeakLevel() : 0;
  }

  getTrackRMSLevel(trackId: string): number {
    const trackNode = this.trackAudioNodes.get(trackId);
    return trackNode ? trackNode.getRMSLevel() : 0;
  }

  // Initialize voices to route through the default track
  private initializeDefaultTrackRouting(): void {
    // Get the first track or selected track
    let track = this.trackManager.getSelectedTrack();
    if (!track) {
      const tracks = this.trackManager.getAllTracks();
      if (tracks.length > 0) {
        track = tracks[0];
        this.trackManager.selectTrack(track.id);
      }
    }

    if (track) {
      this.setVoiceRoutingTrack(track.id);
      this.subscribeToTrackPatch(track.patch);
      this.applyPatchSnapshot(track.patch.getState());
    }
  }

  // Handle track selection changes
  private handleTrackSelected(track: ITrack): void {
    // Switch voice routing to the new track
    this.setVoiceRoutingTrack(track.id);

    // Subscribe to the new track's patch and apply its state
    this.subscribeToTrackPatch(track.patch);
    this.applyPatchSnapshot(track.patch.getState());
  }

  // Reconnect all voices to route through a specific track
  public setVoiceRoutingTrack(trackId: string): void {
    const newTrackNode = this.trackAudioNodes.get(trackId);
    if (!newTrackNode) {
      // Create the track node if it doesn't exist
      this.createTrackAudioNode(trackId);
      return this.setVoiceRoutingTrack(trackId);
    }

    // Disconnect from previous track if one exists
    if (this.currentTrackId) {
      const oldTrackNode = this.trackAudioNodes.get(this.currentTrackId);
      if (oldTrackNode) {
        this.voicePool.forEach(voice => {
          voice.disconnect(oldTrackNode.getInputNode());
        });
      }
    }

    // Connect all voices to this track's input
    this.voicePool.forEach(voice => {
      voice.connect(newTrackNode.getInputNode());
    });

    this.currentTrackId = trackId;
  }

  // Get the current track that voices are routing through
  public getCurrentVoiceTrack(): string | null {
    return this.currentTrackId;
  }
}
