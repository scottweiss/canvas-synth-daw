import { Clip, INote } from './Clip';
import { Transport } from './Transport';
import { AudioEngine } from './AudioEngine';
import { TrackManager } from './TrackManager';

interface PlayingClip {
  clip: Clip;
  trackId: string;
  currentBeat: number;
  activeNotes: Set<number>; // Set of currently playing note pitches
}

export class ClipPlayer {
  private static instance: ClipPlayer;
  private transport: Transport;
  private audioEngine: AudioEngine;
  private trackManager: TrackManager;
  private playingClips: Map<string, PlayingClip> = new Map(); // Map of clip ID to PlayingClip
  private lastBeat: number = -1;

  private constructor() {
    this.transport = Transport.getInstance();
    this.audioEngine = AudioEngine.getInstance();
    this.trackManager = TrackManager.getInstance();
    this.setupListeners();
  }

  public static getInstance(): ClipPlayer {
    if (!ClipPlayer.instance) {
      ClipPlayer.instance = new ClipPlayer();
    }
    return ClipPlayer.instance;
  }

  private setupListeners(): void {
    // Listen for transport ticks
    this.transport.onTick((tick: number) => {
      const currentBeat = this.transport.tickToBeat(tick);
      this.processTick(currentBeat);
    });

    // Listen for transport state changes
    this.transport.onStateChange((isPlaying: boolean) => {
      if (!isPlaying) {
        // Stop all clips when transport stops
        this.stopAll();
      }
    });
  }

  public startClip(clip: Clip, trackId: string): void {
    if (this.playingClips.has(clip.getId())) {
      // Already playing
      return;
    }

    console.log('Starting clip playback:', clip.getId());

    clip.setState('playing');

    const playingClip: PlayingClip = {
      clip,
      trackId,
      currentBeat: 0,
      activeNotes: new Set()
    };

    this.playingClips.set(clip.getId(), playingClip);

    // Start transport if not playing
    if (!this.transport.isPlaying()) {
      this.transport.start();
    }
  }

  public stopClip(clip: Clip): void {
    const playingClip = this.playingClips.get(clip.getId());
    if (!playingClip) return;

    console.log('Stopping clip playback:', clip.getId());

    // Release any active notes
    playingClip.activeNotes.forEach(pitch => {
      this.audioEngine.noteOff(pitch);
    });
    playingClip.activeNotes.clear();

    clip.setState('stopped');
    this.playingClips.delete(clip.getId());
  }

  public toggleClip(clip: Clip, trackId: string): void {
    if (this.playingClips.has(clip.getId())) {
      this.stopClip(clip);
    } else {
      this.startClip(clip, trackId);
    }
  }

  public stopAll(): void {
    const clipsToStop = Array.from(this.playingClips.values());
    clipsToStop.forEach(playingClip => {
      this.stopClip(playingClip.clip);
    });
  }

  public isPlaying(clip: Clip): boolean {
    return this.playingClips.has(clip.getId());
  }

  private processTick(currentBeat: number): void {
    if (this.playingClips.size === 0) return;

    // Check if we've advanced to a new beat
    const beatChanged = Math.floor(currentBeat) !== Math.floor(this.lastBeat);

    this.playingClips.forEach((playingClip) => {
      const { clip, trackId, activeNotes } = playingClip;

      // Update clip position
      const clipLength = clip.getLength();
      playingClip.currentBeat = currentBeat % clipLength;

      // Select the track before playing notes
      const track = this.trackManager.getTrack(trackId);
      if (track) {
        this.trackManager.selectTrack(trackId);
      }

      if (beatChanged) {
        // Get notes that should trigger at this beat position
        const notesToTrigger = clip.getNotesToTrigger(playingClip.currentBeat, 0.1);

        notesToTrigger.forEach(note => {
          // Trigger note on
          this.audioEngine.noteOn(note.pitch, note.velocity);
          activeNotes.add(note.pitch);

          // Schedule note off after duration
          const durationMs = (note.duration * 60000) / this.transport.getBpm();
          setTimeout(() => {
            if (activeNotes.has(note.pitch)) {
              this.audioEngine.noteOff(note.pitch);
              activeNotes.delete(note.pitch);
            }
          }, durationMs);
        });
      }

      // Update clip display position
      clip.updatePosition(playingClip.currentBeat);
    });

    this.lastBeat = currentBeat;
  }

  public getPlayingClips(): Clip[] {
    return Array.from(this.playingClips.values()).map(pc => pc.clip);
  }
}
