import { Transport } from './Transport';
import { TrackManager } from './TrackManager';
import { AudioEngine } from './AudioEngine';
import type { INote } from './Clip';

/**
 * ArrangementPlayer handles playback of arrangement clips on the timeline
 */
export class ArrangementPlayer {
  private static instance: ArrangementPlayer;

  private transport: Transport;
  private trackManager: TrackManager;
  private audioEngine: AudioEngine;
  private activeNotes: Map<string, Set<number>> = new Map();
  private scheduledNoteTimeouts: Set<number> = new Set();
  private lastBeat: number = -1;
  private tickUnsubscribe: (() => void) | null = null;

  private constructor() {
    this.transport = Transport.getInstance();
    this.trackManager = TrackManager.getInstance();
    this.audioEngine = AudioEngine.getInstance();
  }

  static getInstance(): ArrangementPlayer {
    if (!ArrangementPlayer.instance) {
      ArrangementPlayer.instance = new ArrangementPlayer();
    }
    return ArrangementPlayer.instance;
  }

  /**
   * Start listening to transport ticks and play arrangement clips
   */
  start(): void {
    if (this.tickUnsubscribe) {
      return; // Already started
    }

    this.lastBeat = -1;
    this.tickUnsubscribe = this.transport.onTick(this.handleTick.bind(this));
  }

  /**
   * Stop listening to transport ticks
   */
  stop(): void {
    if (this.tickUnsubscribe) {
      this.tickUnsubscribe();
      this.tickUnsubscribe = null;
    }
    this.stopAllNotes();
    this.lastBeat = -1;
  }

  /**
   * Handle transport tick - check for notes at current position and schedule them
   */
  private handleTick(tick: number): void {
    const currentBeat = this.transport.tickToBeat(tick);

    // Only process on beat changes (4 ticks per beat)
    const beatFloor = Math.floor(currentBeat);
    if (beatFloor === this.lastBeat) {
      return;
    }

    this.lastBeat = beatFloor;

    // Get all clips that are active at this beat
    const clipsAtTime = this.trackManager.getArrangementClipsAtTime(currentBeat);
    const allTracks = this.trackManager.getAllTracks();
    const anySoloed = allTracks.some(track => track.soloed);

    // Schedule notes from each active clip
    clipsAtTime.forEach((clips, trackId) => {
      const track = this.trackManager.getTrack(trackId);
      if (!track) {
        return;
      }

      if (track.muted) {
        return;
      }

      if (anySoloed && !track.soloed) {
        return;
      }

      clips.forEach(clip => {
        // Get notes at this position in the clip
        const notes = clip.getNotesAtTime(currentBeat);

        notes.forEach(note => {
          // Check if note starts at this beat
          const noteStartBeat = clip.getStartTime() + note.start;
          if (Math.abs(noteStartBeat - currentBeat) < 0.01) {
            // Note starts now - schedule it
            this.scheduleNote(trackId, note);
          }
        });
      });
    });
  }

  /**
   * Schedule a note to play
   */
  private scheduleNote(trackId: string, note: INote): void {
    const track = this.trackManager.getTrack(trackId);
    if (!track) {
      return;
    }

    const velocity = Math.max(0, Math.min(127, note.velocity ?? 100));
    this.audioEngine.noteOnWithTrack(trackId, note.pitch, velocity);
    this.addActiveNote(trackId, note.pitch);

    const bpm = this.transport.getBpm();
    const beatDuration = 60 / bpm;
    const noteDurationSeconds = Math.max(beatDuration * note.duration, 0);
    const timeoutId = window.setTimeout(() => {
      this.audioEngine.noteOffWithTrack(trackId, note.pitch);
      this.removeActiveNote(trackId, note.pitch);
      this.scheduledNoteTimeouts.delete(timeoutId);
    }, noteDurationSeconds * 1000);

    this.scheduledNoteTimeouts.add(timeoutId);
  }

  /**
   * Stop all currently playing notes
   */
  private stopAllNotes(): void {
    this.scheduledNoteTimeouts.forEach(timeoutId => {
      window.clearTimeout(timeoutId);
    });
    this.scheduledNoteTimeouts.clear();

    this.activeNotes.forEach((notes, trackId) => {
      notes.forEach(midiNote => {
        this.audioEngine.noteOffWithTrack(trackId, midiNote);
      });
    });

    this.activeNotes.clear();
    this.audioEngine.stopAllNotes();
  }

  private addActiveNote(trackId: string, midiNote: number): void {
    if (!this.activeNotes.has(trackId)) {
      this.activeNotes.set(trackId, new Set());
    }
    this.activeNotes.get(trackId)!.add(midiNote);
  }

  private removeActiveNote(trackId: string, midiNote: number): void {
    const notes = this.activeNotes.get(trackId);
    if (!notes) {
      return;
    }
    notes.delete(midiNote);
    if (notes.size === 0) {
      this.activeNotes.delete(trackId);
    }
  }
}
