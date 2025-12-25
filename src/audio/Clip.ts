type EventCallback = (...args: unknown[]) => void;

// Simple event emitter for browser
class SimpleEventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();

  on(event: string, listener: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
  }

  off(event: string, listener: EventCallback): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

export interface INote {
  pitch: number;
  start: number; // Beat position relative to clip start
  duration: number; // In beats
  velocity: number;
}

export type ClipState = 'empty' | 'recording' | 'playing' | 'stopped' | 'queued';

export interface IClip {
  id: string;
  trackId: string;
  sceneIndex: number;
  notes: INote[];
  length: number; // In beats
  state: ClipState;
  name: string;
  color: string;
}

export class Clip extends SimpleEventEmitter {
  private id: string;
  private trackId: string;
  private sceneIndex: number;
  private notes: INote[] = [];
  private length: number; // Length in beats
  private state: ClipState = 'empty';
  private name: string;
  private color: string;
  private currentPosition: number = 0; // Current playback position in beats

  constructor(trackId: string, sceneIndex: number, length: number = 4) {
    super();
    this.id = `clip-${trackId}-${sceneIndex}-${Date.now()}`;
    this.trackId = trackId;
    this.sceneIndex = sceneIndex;
    this.length = length;
    this.name = `Clip ${sceneIndex + 1}`;
    this.color = this.generateColor();
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getTrackId(): string {
    return this.trackId;
  }

  getSceneIndex(): number {
    return this.sceneIndex;
  }

  getNotes(): INote[] {
    return [...this.notes];
  }

  getLength(): number {
    return this.length;
  }

  getState(): ClipState {
    return this.state;
  }

  getName(): string {
    return this.name;
  }

  getColor(): string {
    return this.color;
  }

  getCurrentPosition(): number {
    return this.currentPosition;
  }

  isEmpty(): boolean {
    return this.notes.length === 0 && this.state !== 'recording';
  }

  // Setters
  setName(name: string): void {
    this.name = name;
    this.emit('changed', this.toJSON());
  }

  setColor(color: string): void {
    this.color = color;
    this.emit('changed', this.toJSON());
  }

  setLength(length: number): void {
    this.length = length;
    this.emit('changed', this.toJSON());
  }

  setState(state: ClipState): void {
    const oldState = this.state;
    this.state = state;
    this.emit('stateChanged', { oldState, newState: state });
    this.emit('changed', this.toJSON());
  }

  // Note management
  addNote(note: INote): void {
    this.notes.push(note);
    this.emit('noteAdded', note);
    this.emit('changed', this.toJSON());
  }

  removeNote(noteIndex: number): void {
    if (noteIndex >= 0 && noteIndex < this.notes.length) {
      const removed = this.notes.splice(noteIndex, 1)[0];
      this.emit('noteRemoved', removed);
      this.emit('changed', this.toJSON());
    }
  }

  clearNotes(): void {
    this.notes = [];
    this.emit('cleared');
    this.emit('changed', this.toJSON());
  }

  setNotes(notes: INote[]): void {
    this.notes = notes;
    this.emit('changed', this.toJSON());
  }

  // Playback control
  start(): void {
    if (this.isEmpty()) return;
    this.setState('playing');
    this.currentPosition = 0;
  }

  stop(): void {
    this.setState('stopped');
    this.currentPosition = 0;
  }

  pause(): void {
    if (this.state === 'playing') {
      this.setState('stopped');
    }
  }

  queue(): void {
    this.setState('queued');
  }

  startRecording(): void {
    this.setState('recording');
    this.clearNotes();
    this.currentPosition = 0;
  }

  stopRecording(): void {
    if (this.state === 'recording') {
      this.setState('stopped');
    }
  }

  // Playback position management
  updatePosition(beatPosition: number): void {
    this.currentPosition = beatPosition % this.length;
    this.emit('positionChanged', this.currentPosition);
  }

  // Get notes that should be played at a given beat position
  getNotesAtPosition(beatPosition: number): INote[] {
    const normalizedPosition = beatPosition % this.length;
    return this.notes.filter(note => {
      const noteEnd = note.start + note.duration;
      return note.start <= normalizedPosition && normalizedPosition < noteEnd;
    });
  }

  // Get notes that should trigger at a specific beat
  getNotesToTrigger(beatPosition: number, tolerance: number = 0.01): INote[] {
    const normalizedPosition = beatPosition % this.length;
    return this.notes.filter(note => {
      return Math.abs(note.start - normalizedPosition) < tolerance;
    });
  }

  // Utility
  private generateColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  duplicate(): Clip {
    const newClip = new Clip(this.trackId, this.sceneIndex, this.length);
    newClip.setNotes([...this.notes]);
    newClip.setName(`${this.name} (Copy)`);
    newClip.setColor(this.color);
    return newClip;
  }

  toJSON(): IClip {
    return {
      id: this.id,
      trackId: this.trackId,
      sceneIndex: this.sceneIndex,
      notes: this.notes,
      length: this.length,
      state: this.state,
      name: this.name,
      color: this.color
    };
  }

  static fromJSON(data: IClip): Clip {
    const clip = new Clip(data.trackId, data.sceneIndex, data.length);
    clip.id = data.id;
    clip.setNotes(data.notes);
    clip.setName(data.name);
    clip.setColor(data.color);
    clip.setState(data.state);
    return clip;
  }
}
