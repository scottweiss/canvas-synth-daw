import { Clip, IClip, ClipState, INote } from './Clip';

/**
 * Interface for arrangement clip JSON serialization
 */
export interface IArrangementClip extends IClip {
  startTime: number; // Start position in beats
  endTime?: number; // Optional end time for trimmed clips
}

/**
 * ArrangementClip extends Clip with timeline positioning
 * Used in the Arrangement View for timeline-based composition
 */
export class ArrangementClip extends Clip {
  private startTime: number; // Position on timeline in beats
  private endTime: number | null = null; // For trimmed clips

  constructor(trackId: string, startTime: number = 0, length: number = 4) {
    // Scene index is not relevant for arrangement clips
    super(trackId, -1, length);
    this.startTime = startTime;
  }

  /**
   * Get the start position on the timeline (in beats)
   */
  getStartTime(): number {
    return this.startTime;
  }

  /**
   * Set the start position on the timeline (in beats)
   */
  setStartTime(startTime: number): void {
    if (startTime < 0) {
      startTime = 0;
    }
    this.startTime = startTime;
    this.emit('changed', this.toJSON());
  }

  /**
   * Get the end position on the timeline (in beats)
   */
  getEndTime(): number {
    return this.endTime !== null ? this.endTime : this.startTime + this.getLength();
  }

  /**
   * Set the end position (for trimming clips)
   */
  setEndTime(endTime: number): void {
    if (endTime <= this.startTime) {
      return; // End must be after start
    }
    this.endTime = endTime;
    this.emit('changed', this.toJSON());
  }

  /**
   * Clear the end time (remove trimming)
   */
  clearEndTime(): void {
    this.endTime = null;
    this.emit('changed', this.toJSON());
  }

  /**
   * Get the visible/playable length (accounting for trimming)
   */
  getVisibleLength(): number {
    if (this.endTime !== null) {
      return this.endTime - this.startTime;
    }
    return this.getLength();
  }

  /**
   * Check if a timeline position (in beats) is within this clip
   */
  containsTime(time: number): boolean {
    return time >= this.startTime && time < this.getEndTime();
  }

  /**
   * Get notes that should play at a specific timeline position
   */
  getNotesAtTime(timelinePosition: number, tolerance: number = 0.1): INote[] {
    if (!this.containsTime(timelinePosition)) {
      return [];
    }

    // Convert timeline position to clip-relative position
    const relativePosition = timelinePosition - this.startTime;
    return this.getNotesAtPosition(relativePosition);
  }

  /**
   * Get notes that should trigger at a timeline position
   */
  getNotesToTriggerAtTime(timelinePosition: number, tolerance: number = 0.1): INote[] {
    if (!this.containsTime(timelinePosition)) {
      return [];
    }

    const relativePosition = timelinePosition - this.startTime;
    return this.getNotesToTrigger(relativePosition, tolerance);
  }

  /**
   * Serialize to JSON
   */
  toJSON(): IArrangementClip {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      startTime: this.startTime,
      endTime: this.endTime !== null ? this.endTime : undefined
    };
  }

  /**
   * Create ArrangementClip from JSON
   */
  static fromJSON(json: IArrangementClip): ArrangementClip {
    const clip = new ArrangementClip(json.trackId, json.startTime, json.length);

    // Restore base clip properties
    clip.setName(json.name);
    clip.setColor(json.color);
    clip.setNotes(json.notes);

    // Restore arrangement-specific properties
    if (json.endTime !== undefined) {
      clip.setEndTime(json.endTime);
    }

    return clip;
  }

  /**
   * Duplicate this clip
   */
  duplicate(): ArrangementClip {
    const duplicate = new ArrangementClip(
      this.getTrackId(),
      this.startTime,
      this.getLength()
    );

    duplicate.setName(this.getName() + ' (Copy)');
    duplicate.setColor(this.getColor());
    duplicate.setNotes([...this.getNotes()]);

    if (this.endTime !== null) {
      duplicate.setEndTime(this.endTime);
    }

    return duplicate;
  }
}
