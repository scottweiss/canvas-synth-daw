import { SynthPatch } from './SynthPatch';
import { Clip, IClip } from './Clip';
import { ArrangementClip, IArrangementClip } from './ArrangementClip';

// Simple event emitter for browser
class SimpleEventEmitter {
  private events: Map<string, Set<Function>> = new Map();

  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }
}

export interface INote {
  id: string;
  pitch: number; // MIDI note number
  start: number; // In beats
  duration: number; // In beats
  velocity: number; // 0-127
}

export interface ITrack {
  id: string;
  name: string;
  color: string;
  patch: SynthPatch;
  notes: INote[];
  clips: Map<number, Clip>; // Map of scene index to Clip (Session View)
  arrangementClips: ArrangementClip[]; // Array of timeline clips (Arrangement View)
  volume: number; // 0-1
  pan: number; // -1 to 1
  muted: boolean;
  soloed: boolean;
  armed: boolean;
  index: number;
}

interface ITrackData {
  id: string;
  name: string;
  color: string;
  notes: INote[];
  clips: IClip[]; // Serialized Session View clips
  arrangementClips: IArrangementClip[]; // Serialized Arrangement View clips
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  armed: boolean;
  index: number;
  patchState: any; // Serialized patch state
}

export class TrackManager extends SimpleEventEmitter {
  private static instance: TrackManager;
  private tracks: Map<string, ITrack> = new Map();
  private selectedTrackId: string | null = null;
  private trackColors: string[] = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A3CB38'
  ];

  private constructor() {
    super();
    this.loadFromStorage();

    // Create a default track if none exist
    if (this.tracks.size === 0) {
      this.createTrack('Synth 1');
    }
  }

  public static getInstance(): TrackManager {
    if (!TrackManager.instance) {
      TrackManager.instance = new TrackManager();
    }
    return TrackManager.instance;
  }

  public createTrack(name?: string): ITrack {
    const id = this.generateId();
    const index = this.tracks.size;
    const color = this.trackColors[index % this.trackColors.length];

    const track: ITrack = {
      id,
      name: name || `Track ${index + 1}`,
      color,
      patch: new SynthPatch(),
      notes: [],
      clips: new Map<number, Clip>(),
      arrangementClips: [],
      volume: 0.8,
      pan: 0,
      muted: false,
      soloed: false,
      armed: false,
      index
    };

    this.tracks.set(id, track);

    // Select the first track automatically
    if (this.tracks.size === 1) {
      this.selectedTrackId = id;
    }

    this.emit('trackCreated', track);
    this.emit('tracksChanged', this.getAllTracks());
    this.saveToStorage();

    return track;
  }

  public deleteTrack(id: string): void {
    const track = this.tracks.get(id);
    if (!track) return;

    this.tracks.delete(id);

    // If deleted track was selected, select another
    if (this.selectedTrackId === id) {
      const remainingTracks = Array.from(this.tracks.values());
      this.selectedTrackId = remainingTracks.length > 0 ? remainingTracks[0].id : null;
      if (this.selectedTrackId) {
        this.emit('trackSelected', this.getTrack(this.selectedTrackId));
      }
    }

    this.emit('trackDeleted', id);
    this.emit('tracksChanged', this.getAllTracks());
    this.saveToStorage();
  }

  public getTrack(id: string): ITrack | undefined {
    return this.tracks.get(id);
  }

  public getAllTracks(): ITrack[] {
    return Array.from(this.tracks.values()).sort((a, b) => a.index - b.index);
  }

  public selectTrack(id: string): void {
    const track = this.tracks.get(id);
    if (!track) return;

    this.selectedTrackId = id;
    this.emit('trackSelected', track);
  }

  public getSelectedTrack(): ITrack | null {
    return this.selectedTrackId ? this.tracks.get(this.selectedTrackId) || null : null;
  }

  public updateTrack(id: string, updates: Partial<ITrack>): void {
    const track = this.tracks.get(id);
    if (!track) return;

    Object.assign(track, updates);
    this.emit('trackUpdated', track);
    this.emit('tracksChanged', this.getAllTracks());
    this.saveToStorage();
  }

  public reorderTracks(fromIndex: number, toIndex: number): void {
    const tracksArray = this.getAllTracks();
    const [movedTrack] = tracksArray.splice(fromIndex, 1);
    tracksArray.splice(toIndex, 0, movedTrack);

    // Update indices
    tracksArray.forEach((track, index) => {
      track.index = index;
    });

    this.emit('tracksChanged', this.getAllTracks());
    this.saveToStorage();
  }

  public addNote(trackId: string, note: Omit<INote, 'id'>): INote {
    const track = this.tracks.get(trackId);
    if (!track) throw new Error('Track not found');

    const newNote: INote = {
      ...note,
      id: this.generateId()
    };

    track.notes.push(newNote);
    this.emit('notesChanged', trackId, track.notes);
    this.saveToStorage();

    return newNote;
  }

  public removeNote(trackId: string, noteId: string): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    track.notes = track.notes.filter(n => n.id !== noteId);
    this.emit('notesChanged', trackId, track.notes);
    this.saveToStorage();
  }

  public updateNote(trackId: string, noteId: string, updates: Partial<INote>): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    const note = track.notes.find(n => n.id === noteId);
    if (!note) return;

    Object.assign(note, updates);
    this.emit('notesChanged', trackId, track.notes);
    this.saveToStorage();
  }

  public getNotes(trackId: string): INote[] {
    const track = this.tracks.get(trackId);
    return track ? [...track.notes] : [];
  }

  public clearNotes(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    track.notes = [];
    this.emit('notesChanged', trackId, track.notes);
    this.saveToStorage();
  }

  // Clip Management
  public createClip(trackId: string, sceneIndex: number, length: number = 4): Clip {
    const track = this.tracks.get(trackId);
    if (!track) throw new Error('Track not found');

    const clip = new Clip(trackId, sceneIndex, length);
    track.clips.set(sceneIndex, clip);

    this.emit('clipCreated', trackId, sceneIndex, clip);
    this.saveToStorage();

    return clip;
  }

  public getClip(trackId: string, sceneIndex: number): Clip | undefined {
    const track = this.tracks.get(trackId);
    if (!track) return undefined;

    return track.clips.get(sceneIndex);
  }

  public getAllClips(trackId: string): Clip[] {
    const track = this.tracks.get(trackId);
    if (!track) return [];

    return Array.from(track.clips.values());
  }

  public deleteClip(trackId: string, sceneIndex: number): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    const clip = track.clips.get(sceneIndex);
    if (clip) {
      track.clips.delete(sceneIndex);
      this.emit('clipDeleted', trackId, sceneIndex);
      this.saveToStorage();
    }
  }

  public getClipsInScene(sceneIndex: number): Map<string, Clip> {
    const sceneClips = new Map<string, Clip>();

    this.tracks.forEach(track => {
      const clip = track.clips.get(sceneIndex);
      if (clip) {
        sceneClips.set(track.id, clip);
      }
    });

    return sceneClips;
  }

  public getSceneCount(): number {
    let maxScene = -1;

    this.tracks.forEach(track => {
      track.clips.forEach((_, sceneIndex) => {
        maxScene = Math.max(maxScene, sceneIndex);
      });
    });

    return maxScene + 1;
  }

  // Arrangement Clip Management

  public createArrangementClip(trackId: string, startTime: number = 0, length: number = 4): ArrangementClip {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    const clip = new ArrangementClip(trackId, startTime, length);
    track.arrangementClips.push(clip);

    this.emit('arrangementClipCreated', trackId, clip);
    this.saveToStorage();

    return clip;
  }

  public getArrangementClips(trackId: string): ArrangementClip[] {
    const track = this.tracks.get(trackId);
    if (!track) {
      return [];
    }
    return track.arrangementClips;
  }

  public getAllArrangementClips(): Map<string, ArrangementClip[]> {
    const allClips = new Map<string, ArrangementClip[]>();
    this.tracks.forEach((track, trackId) => {
      if (track.arrangementClips.length > 0) {
        allClips.set(trackId, track.arrangementClips);
      }
    });
    return allClips;
  }

  public deleteArrangementClip(trackId: string, clipId: string): void {
    const track = this.tracks.get(trackId);
    if (!track) {
      return;
    }

    const index = track.arrangementClips.findIndex(c => c.getId() === clipId);
    if (index !== -1) {
      const clip = track.arrangementClips[index];
      track.arrangementClips.splice(index, 1);

      this.emit('arrangementClipDeleted', trackId, clipId);
      this.saveToStorage();
    }
  }

  public getArrangementClipsAtTime(time: number): Map<string, ArrangementClip[]> {
    const clipsAtTime = new Map<string, ArrangementClip[]>();

    this.tracks.forEach((track, trackId) => {
      const clips = track.arrangementClips.filter(clip => clip.containsTime(time));
      if (clips.length > 0) {
        clipsAtTime.set(trackId, clips);
      }
    });

    return clipsAtTime;
  }

  public getArrangementLength(): number {
    let maxTime = 0;

    this.tracks.forEach(track => {
      track.arrangementClips.forEach(clip => {
        maxTime = Math.max(maxTime, clip.getEndTime());
      });
    });

    return maxTime;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToStorage(): void {
    try {
      const data: ITrackData[] = Array.from(this.tracks.values()).map(track => ({
        id: track.id,
        name: track.name,
        color: track.color,
        notes: track.notes,
        clips: Array.from(track.clips.values()).map(clip => clip.toJSON()),
        arrangementClips: track.arrangementClips.map(clip => clip.toJSON()),
        volume: track.volume,
        pan: track.pan,
        muted: track.muted,
        soloed: track.soloed,
        armed: track.armed,
        index: track.index,
        patchState: track.patch.getState()
      }));

      localStorage.setItem('daw-tracks', JSON.stringify(data));
      localStorage.setItem('daw-selected-track', this.selectedTrackId || '');
    } catch (error) {
      console.error('Failed to save tracks to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('daw-tracks');
      const selectedId = localStorage.getItem('daw-selected-track');

      if (data) {
        const tracksData: ITrackData[] = JSON.parse(data);

        tracksData.forEach(trackData => {
          // Pass saved state to SynthPatch constructor
          const patch = new SynthPatch(trackData.patchState || {});

          // Restore clips
          const clips = new Map<number, Clip>();
          if (trackData.clips) {
            trackData.clips.forEach((clipData: IClip) => {
              const clip = Clip.fromJSON(clipData);
              clips.set(clipData.sceneIndex, clip);
            });
          }

          // Restore arrangement clips
          const arrangementClips: ArrangementClip[] = [];
          if (trackData.arrangementClips) {
            trackData.arrangementClips.forEach((clipData: IArrangementClip) => {
              const clip = ArrangementClip.fromJSON(clipData);
              arrangementClips.push(clip);
            });
          }

          const track: ITrack = {
            id: trackData.id,
            name: trackData.name,
            color: trackData.color,
            patch,
            notes: trackData.notes || [],
            clips,
            arrangementClips,
            volume: trackData.volume ?? 0.8,
            pan: trackData.pan ?? 0,
            muted: trackData.muted ?? false,
            soloed: trackData.soloed ?? false,
            armed: trackData.armed ?? false,
            index: trackData.index ?? 0
          };

          this.tracks.set(track.id, track);
        });

        this.selectedTrackId = selectedId || null;
      }
    } catch (error) {
      console.error('Failed to load tracks from storage:', error);
    }
  }

  public exportProject(): string {
    const data = {
      tracks: Array.from(this.tracks.values()).map(track => ({
        id: track.id,
        name: track.name,
        color: track.color,
        notes: track.notes,
        clips: Array.from(track.clips.values()).map(clip => clip.toJSON()),
        volume: track.volume,
        pan: track.pan,
        muted: track.muted,
        soloed: track.soloed,
        armed: track.armed,
        index: track.index,
        patchState: track.patch.getState()
      })),
      selectedTrackId: this.selectedTrackId
    };

    return JSON.stringify(data, null, 2);
  }

  public importProject(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString);

      // Clear existing tracks
      this.tracks.clear();

      // Import tracks
      data.tracks.forEach((trackData: ITrackData) => {
        // Pass saved state to SynthPatch constructor
        const patch = new SynthPatch(trackData.patchState || {});

        // Restore clips
        const clips = new Map<number, Clip>();
        if (trackData.clips) {
          trackData.clips.forEach((clipData: IClip) => {
            const clip = Clip.fromJSON(clipData);
            clips.set(clipData.sceneIndex, clip);
          });
        }

        const track: ITrack = {
          id: trackData.id,
          name: trackData.name,
          color: trackData.color,
          patch,
          notes: trackData.notes || [],
          clips,
          volume: trackData.volume ?? 0.8,
          pan: trackData.pan ?? 0,
          muted: trackData.muted ?? false,
          soloed: trackData.soloed ?? false,
          armed: trackData.armed ?? false,
          index: trackData.index ?? 0
        };

        this.tracks.set(track.id, track);
      });

      this.selectedTrackId = data.selectedTrackId || null;

      this.emit('projectImported');
      this.emit('tracksChanged', this.getAllTracks());
      if (this.selectedTrackId) {
        this.emit('trackSelected', this.getTrack(this.selectedTrackId));
      }

      this.saveToStorage();
    } catch (error) {
      console.error('Failed to import project:', error);
      throw new Error('Invalid project file');
    }
  }
}
