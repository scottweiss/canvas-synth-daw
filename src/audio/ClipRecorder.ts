import { Clip, INote } from './Clip';
import { Transport } from './Transport';

export class ClipRecorder {
  private static instance: ClipRecorder;
  private transport: Transport;
  private activeClip: Clip | null = null;
  private recordingStartBeat: number = 0;
  private activeNotes: Map<number, { pitch: number; startBeat: number; velocity: number }> = new Map();
  private isRecording: boolean = false;

  private constructor() {
    this.transport = Transport.getInstance();
    this.setupListeners();
  }

  public static getInstance(): ClipRecorder {
    if (!ClipRecorder.instance) {
      ClipRecorder.instance = new ClipRecorder();
    }
    return ClipRecorder.instance;
  }

  private setupListeners(): void {
    // Listen for note on/off events from the audio engine
    // These will be dispatched by piano keys and other input sources
    window.addEventListener('noteOn', ((e: CustomEvent) => {
      this.handleNoteOn(e.detail.pitch, e.detail.velocity);
    }) as EventListener);

    window.addEventListener('noteOff', ((e: CustomEvent) => {
      this.handleNoteOff(e.detail.pitch);
    }) as EventListener);

    // Listen for transport ticks to update recording position
    this.transport.onTick((tick: number) => {
      if (this.isRecording && this.activeClip) {
        // Update clip position
        const currentBeat = this.transport.tickToBeat(tick);
        this.activeClip.updatePosition(currentBeat - this.recordingStartBeat);
      }
    });
  }

  public startRecording(clip: Clip): void {
    if (this.isRecording) {
      this.stopRecording();
    }

    this.activeClip = clip;
    this.isRecording = true;
    this.activeNotes.clear();

    // Get current transport position
    this.recordingStartBeat = this.transport.getCurrentBeat();

    // Set clip state
    clip.startRecording();
  }

  public stopRecording(): void {
    if (!this.isRecording || !this.activeClip) return;

    // Finish any active notes
    this.activeNotes.forEach((noteData) => {
      const currentBeat = this.transport.getCurrentBeat();
      const relativeBeat = currentBeat - this.recordingStartBeat;
      const duration = relativeBeat - noteData.startBeat;

      if (duration > 0) {
        const note: INote = {
          pitch: noteData.pitch,
          start: noteData.startBeat,
          duration,
          velocity: noteData.velocity
        };
        this.activeClip!.addNote(note);
      }
    });

    this.activeNotes.clear();

    // Stop recording state
    this.activeClip.stopRecording();

    this.isRecording = false;
    this.activeClip = null;
  }

  private handleNoteOn(pitch: number, velocity: number = 100): void {
    if (!this.isRecording || !this.activeClip) return;

    const currentBeat = this.transport.getCurrentBeat();
    const relativeBeat = currentBeat - this.recordingStartBeat;

    // Check if note is within clip length
    if (relativeBeat >= this.activeClip.getLength()) {
      // Wrap around for looping recording
      const wrappedBeat = relativeBeat % this.activeClip.getLength();
      this.activeNotes.set(pitch, {
        pitch,
        startBeat: wrappedBeat,
        velocity
      });
    } else {
      this.activeNotes.set(pitch, {
        pitch,
        startBeat: relativeBeat,
        velocity
      });
    }
  }

  private handleNoteOff(pitch: number): void {
    if (!this.isRecording || !this.activeClip) return;

    const noteData = this.activeNotes.get(pitch);
    if (!noteData) return;

    const currentBeat = this.transport.getCurrentBeat();
    const relativeBeat = currentBeat - this.recordingStartBeat;
    const duration = relativeBeat - noteData.startBeat;

    if (duration > 0) {
      const note: INote = {
        pitch: noteData.pitch,
        start: noteData.startBeat,
        duration,
        velocity: noteData.velocity
      };

      this.activeClip.addNote(note);
    }

    this.activeNotes.delete(pitch);
  }

  public isRecordingActive(): boolean {
    return this.isRecording;
  }

  public getActiveClip(): Clip | null {
    return this.activeClip;
  }
}
