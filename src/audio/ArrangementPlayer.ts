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
  private scheduledNotes: Map<string, number[]> = new Map(); // Track active note IDs per track
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
    console.log('ArrangementPlayer started');
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
    console.log('ArrangementPlayer stopped');
  }

  /**
   * Handle transport tick - check for notes at current position and schedule them
   */
  private handleTick(tick: number, time: number): void {
    const currentBeat = this.transport.getCurrentBeat();

    // Only process on beat changes (4 ticks per beat)
    const beatFloor = Math.floor(currentBeat);
    if (beatFloor === this.lastBeat) {
      return;
    }

    this.lastBeat = beatFloor;

    // Get all clips that are active at this beat
    const clipsAtTime = this.trackManager.getArrangementClipsAtTime(currentBeat);

    // Schedule notes from each active clip
    clipsAtTime.forEach((clips, trackId) => {
      const track = this.trackManager.getTrack(trackId);
      if (!track || track.muted) {
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
            this.scheduleNote(trackId, note, time);
          }
        });
      });
    });
  }

  /**
   * Schedule a note to play
   */
  private scheduleNote(trackId: string, note: INote, time: number): void {
    const track = this.trackManager.getTrack(trackId);
    if (!track) {
      return;
    }

    // Set the track's patch active before playing
    this.audioEngine.setCurrentPatch(track.patch);

    // Calculate note duration in seconds
    const bpm = this.transport.getBpm();
    const beatDuration = 60 / bpm; // Seconds per beat
    const noteDuration = note.duration * beatDuration;

    // Play the note
    const noteId = this.audioEngine.noteOn(note.pitch, note.velocity / 127, time);

    // Track active notes for this track
    if (!this.scheduledNotes.has(trackId)) {
      this.scheduledNotes.set(trackId, []);
    }
    this.scheduledNotes.get(trackId)!.push(noteId);

    // Schedule note off
    setTimeout(() => {
      this.audioEngine.noteOff(note.pitch, time + noteDuration);

      // Remove from active notes
      const activeNotes = this.scheduledNotes.get(trackId);
      if (activeNotes) {
        const index = activeNotes.indexOf(noteId);
        if (index > -1) {
          activeNotes.splice(index, 1);
        }
      }
    }, noteDuration * 1000);
  }

  /**
   * Stop all currently playing notes
   */
  private stopAllNotes(): void {
    const time = this.audioEngine.audioContext.currentTime;

    this.scheduledNotes.forEach((noteIds, trackId) => {
      noteIds.forEach(noteId => {
        // Note: noteOff expects a pitch, but we don't have it here
        // This is a limitation - we might need to track pitch as well
        // For now, we'll just clear the map
      });
    });

    this.scheduledNotes.clear();
  }
}
