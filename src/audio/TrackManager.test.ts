import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrackManager } from './TrackManager';
import type { ITrack } from './TrackManager';

describe('TrackManager', () => {
  let trackManager: TrackManager;

  beforeEach(() => {
    trackManager = TrackManager.getInstance();
    // Clear all tracks before each test
    const tracks = trackManager.getAllTracks();
    tracks.forEach(track => {
      trackManager.deleteTrack(track.id);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TrackManager.getInstance();
      const instance2 = TrackManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Track CRUD Operations', () => {
    it('should create a track', () => {
      const tracksBefore = trackManager.getAllTracks().length;
      const track = trackManager.createTrack('Test Track');
      expect(trackManager.getAllTracks().length).toBe(tracksBefore + 1);
      expect(track.name).toBe('Test Track');
    });

    it('should create track with default name', () => {
      const track = trackManager.createTrack();
      expect(track.name).toContain('Track');
    });

    it('should get track by id', () => {
      const track = trackManager.createTrack('Find Me');
      const found = trackManager.getTrack(track.id);
      expect(found).toBe(track);
      expect(found?.name).toBe('Find Me');
    });

    it('should return undefined for non-existent track', () => {
      const track = trackManager.getTrack('non-existent');
      expect(track).toBeUndefined();
    });

    it('should get all tracks', () => {
      trackManager.createTrack('Track 1');
      trackManager.createTrack('Track 2');
      const tracks = trackManager.getAllTracks();
      expect(tracks.length).toBeGreaterThanOrEqual(2);
    });

    it('should update track', () => {
      const track = trackManager.createTrack('Original Name');
      trackManager.updateTrack(track.id, { name: 'Updated Name' });
      const updated = trackManager.getTrack(track.id);
      expect(updated?.name).toBe('Updated Name');
    });

    it('should update track color', () => {
      const track = trackManager.createTrack('Color Test');
      trackManager.updateTrack(track.id, { color: '#ff0000' });
      const updated = trackManager.getTrack(track.id);
      expect(updated?.color).toBe('#ff0000');
    });

    it('should update track volume', () => {
      const track = trackManager.createTrack('Volume Test');
      trackManager.updateTrack(track.id, { volume: 0.5 });
      const updated = trackManager.getTrack(track.id);
      expect(updated?.volume).toBe(0.5);
    });

    it('should update track pan', () => {
      const track = trackManager.createTrack('Pan Test');
      trackManager.updateTrack(track.id, { pan: -0.5 });
      const updated = trackManager.getTrack(track.id);
      expect(updated?.pan).toBe(-0.5);
    });

    it('should update track muted state', () => {
      const track = trackManager.createTrack('Mute Test');
      trackManager.updateTrack(track.id, { muted: true });
      const updated = trackManager.getTrack(track.id);
      expect(updated?.muted).toBe(true);
    });

    it('should update track soloed state', () => {
      const track = trackManager.createTrack('Solo Test');
      trackManager.updateTrack(track.id, { soloed: true });
      const updated = trackManager.getTrack(track.id);
      expect(updated?.soloed).toBe(true);
    });

    it('should not update non-existent track', () => {
      trackManager.updateTrack('non-existent', { name: 'Should Fail' });
      // Should not throw
      expect(true).toBe(true);
    });

    it('should delete track', () => {
      const track = trackManager.createTrack('Delete Me');
      const lengthBefore = trackManager.getAllTracks().length;
      trackManager.deleteTrack(track.id);
      expect(trackManager.getAllTracks().length).toBe(lengthBefore - 1);
      expect(trackManager.getTrack(track.id)).toBeUndefined();
    });

    it('should not delete non-existent track', () => {
      const lengthBefore = trackManager.getAllTracks().length;
      trackManager.deleteTrack('non-existent');
      expect(trackManager.getAllTracks().length).toBe(lengthBefore);
    });
  });

  describe('Track Selection', () => {
    it('should select track', () => {
      const track = trackManager.createTrack('Select Me');
      trackManager.selectTrack(track.id);
      const selected = trackManager.getSelectedTrack();
      expect(selected?.id).toBe(track.id);
    });

    it('should get selected track', () => {
      const track = trackManager.createTrack('Selected');
      trackManager.selectTrack(track.id);
      const selected = trackManager.getSelectedTrack();
      expect(selected).not.toBeNull();
      expect(selected?.id).toBe(track.id);
    });

    it('should return null if no track selected', () => {
      // Clear all tracks
      trackManager.getAllTracks().forEach(t => trackManager.deleteTrack(t.id));
      const selected = trackManager.getSelectedTrack();
      expect(selected).toBeNull();
    });

    it('should not select non-existent track', () => {
      trackManager.selectTrack('non-existent');
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Note Operations', () => {
    let testTrack: ITrack;

    beforeEach(() => {
      testTrack = trackManager.createTrack('Note Test Track');
    });

    it('should add note to track', () => {
      const note = {
        pitch: 60,
        start: 0,
        duration: 1,
        velocity: 100
      };

      trackManager.addNote(testTrack.id, note);
      const track = trackManager.getTrack(testTrack.id);
      expect(track?.notes.length).toBe(1);
      expect(track?.notes[0].pitch).toBe(60);
    });

    it('should generate unique note IDs', () => {
      const note1 = {
        pitch: 60,
        start: 0,
        duration: 1,
        velocity: 100
      };
      const note2 = {
        pitch: 64,
        start: 1,
        duration: 1,
        velocity: 100
      };

      trackManager.addNote(testTrack.id, note1);
      trackManager.addNote(testTrack.id, note2);

      const track = trackManager.getTrack(testTrack.id);
      const ids = track!.notes.map(n => n.id);
      expect(new Set(ids).size).toBe(2); // All unique
    });

    it('should not add note to non-existent track', () => {
      const note = {
        pitch: 60,
        start: 0,
        duration: 1,
        velocity: 100
      };

      expect(() => {
        trackManager.addNote('non-existent', note);
      }).toThrow('Track not found');
    });

    it('should remove note from track', () => {
      const note = {
        pitch: 60,
        start: 0,
        duration: 1,
        velocity: 100
      };

      trackManager.addNote(testTrack.id, note);
      const track = trackManager.getTrack(testTrack.id);
      const noteId = track!.notes[0].id;

      trackManager.removeNote(testTrack.id, noteId);
      const updatedTrack = trackManager.getTrack(testTrack.id);
      expect(updatedTrack?.notes.length).toBe(0);
    });

    it('should not remove non-existent note', () => {
      const lengthBefore = testTrack.notes.length;
      trackManager.removeNote(testTrack.id, 'non-existent-note');
      const track = trackManager.getTrack(testTrack.id);
      expect(track?.notes.length).toBe(lengthBefore);
    });

    it('should not remove note from non-existent track', () => {
      trackManager.removeNote('non-existent', 'note-id');
      // Should not throw
      expect(true).toBe(true);
    });

    it('should update note', () => {
      const note = {
        pitch: 60,
        start: 0,
        duration: 1,
        velocity: 100
      };

      trackManager.addNote(testTrack.id, note);
      const track = trackManager.getTrack(testTrack.id);
      const noteId = track!.notes[0].id;

      trackManager.updateNote(testTrack.id, noteId, { pitch: 64, duration: 2 });
      const updatedTrack = trackManager.getTrack(testTrack.id);
      const updatedNote = updatedTrack?.notes[0];
      expect(updatedNote?.pitch).toBe(64);
      expect(updatedNote?.duration).toBe(2);
      expect(updatedNote?.velocity).toBe(100); // Should preserve
    });

    it('should not update non-existent note', () => {
      trackManager.updateNote(testTrack.id, 'non-existent', { pitch: 64 });
      // Should not throw
      expect(true).toBe(true);
    });

    it('should not update note in non-existent track', () => {
      trackManager.updateNote('non-existent', 'note-id', { pitch: 64 });
      // Should not throw
      expect(true).toBe(true);
    });

    it('should clear all notes from track', () => {
      trackManager.addNote(testTrack.id, { pitch: 60, start: 0, duration: 1, velocity: 100 });
      trackManager.addNote(testTrack.id, { pitch: 64, start: 1, duration: 1, velocity: 100 });
      trackManager.addNote(testTrack.id, { pitch: 67, start: 2, duration: 1, velocity: 100 });

      trackManager.clearNotes(testTrack.id);
      const track = trackManager.getTrack(testTrack.id);
      expect(track?.notes.length).toBe(0);
    });

    it('should not clear notes from non-existent track', () => {
      trackManager.clearNotes('non-existent');
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Event Listeners', () => {
    it('should emit trackCreated event', () => {
      const listener = vi.fn();
      trackManager.on('trackCreated', listener);

      const track = trackManager.createTrack('New Track');
      expect(listener).toHaveBeenCalledWith(track);
    });

    it('should emit trackDeleted event', () => {
      const track = trackManager.createTrack('Delete Me');
      const listener = vi.fn();
      trackManager.on('trackDeleted', listener);

      trackManager.deleteTrack(track.id);
      expect(listener).toHaveBeenCalledWith(track.id);
    });

    it('should emit trackUpdated event', () => {
      const track = trackManager.createTrack('Update Me');
      const listener = vi.fn();
      trackManager.on('trackUpdated', listener);

      trackManager.updateTrack(track.id, { name: 'Updated' });
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ id: track.id, name: 'Updated' })
      );
    });

    it('should emit trackSelected event', () => {
      const track = trackManager.createTrack('Select Me');
      const listener = vi.fn();
      trackManager.on('trackSelected', listener);

      trackManager.selectTrack(track.id);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ id: track.id })
      );
    });

    it('should emit notesChanged event when adding note', () => {
      const track = trackManager.createTrack('Note Track');
      const listener = vi.fn();
      trackManager.on('notesChanged', listener);

      trackManager.addNote(track.id, { pitch: 60, start: 0, duration: 1, velocity: 100 });
      expect(listener).toHaveBeenCalledWith(track.id, expect.any(Array));
    });

    it('should emit notesChanged event when removing note', () => {
      const track = trackManager.createTrack('Note Track');
      trackManager.addNote(track.id, { pitch: 60, start: 0, duration: 1, velocity: 100 });
      const noteId = trackManager.getTrack(track.id)!.notes[0].id;

      const listener = vi.fn();
      trackManager.on('notesChanged', listener);

      trackManager.removeNote(track.id, noteId);
      expect(listener).toHaveBeenCalledWith(track.id, expect.any(Array));
    });

    it('should emit notesChanged event when updating note', () => {
      const track = trackManager.createTrack('Note Track');
      trackManager.addNote(track.id, { pitch: 60, start: 0, duration: 1, velocity: 100 });
      const noteId = trackManager.getTrack(track.id)!.notes[0].id;

      const listener = vi.fn();
      trackManager.on('notesChanged', listener);

      trackManager.updateNote(track.id, noteId, { pitch: 64 });
      expect(listener).toHaveBeenCalledWith(track.id, expect.any(Array));
    });

    it('should emit notesChanged event when clearing notes', () => {
      const track = trackManager.createTrack('Note Track');
      trackManager.addNote(track.id, { pitch: 60, start: 0, duration: 1, velocity: 100 });

      const listener = vi.fn();
      trackManager.on('notesChanged', listener);

      trackManager.clearNotes(track.id);
      expect(listener).toHaveBeenCalledWith(track.id, expect.any(Array));
    });

    it('should unsubscribe listener', () => {
      const listener = vi.fn();
      trackManager.on('trackCreated', listener);

      // Create track should trigger listener
      const track1 = trackManager.createTrack('First');
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(track1);

      // Unsubscribe
      trackManager.off('trackCreated', listener);

      // Create another track should NOT trigger listener
      trackManager.createTrack('Second');
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });

  describe('Track Properties', () => {
    it('should create track with default properties', () => {
      const track = trackManager.createTrack();
      expect(track.volume).toBeDefined();
      expect(track.pan).toBeDefined();
      expect(track.muted).toBe(false);
      expect(track.soloed).toBe(false);
      expect(track.notes).toEqual([]);
      expect(track.patch).toBeDefined();
    });

    it('should create track with unique color', () => {
      const track1 = trackManager.createTrack();
      const track2 = trackManager.createTrack();
      expect(track1.color).toBeDefined();
      expect(track2.color).toBeDefined();
      expect(typeof track1.color).toBe('string');
      expect(typeof track2.color).toBe('string');
    });

    it('should create track with independent patch', () => {
      const track1 = trackManager.createTrack();
      const track2 = trackManager.createTrack();
      expect(track1.patch).not.toBe(track2.patch);
    });
  });

  describe('Track Reordering', () => {
    it('should reorder tracks', () => {
      trackManager.createTrack('Track 1');
      trackManager.createTrack('Track 2');
      trackManager.createTrack('Track 3');

      // Move track1 (index 0) to index 2
      trackManager.reorderTracks(0, 2);

      const tracks = trackManager.getAllTracks();
      expect(tracks[0].name).toBe('Track 2');
      expect(tracks[1].name).toBe('Track 3');
      expect(tracks[2].name).toBe('Track 1');
    });

    it('should update track indices after reordering', () => {
      trackManager.createTrack('A');
      trackManager.createTrack('B');
      trackManager.createTrack('C');

      trackManager.reorderTracks(2, 0);

      const tracks = trackManager.getAllTracks();
      expect(tracks[0].index).toBe(0);
      expect(tracks[1].index).toBe(1);
      expect(tracks[2].index).toBe(2);
    });

    it('should emit tracksChanged on reorder', () => {
      trackManager.createTrack('1');
      trackManager.createTrack('2');

      const listener = vi.fn();
      trackManager.on('tracksChanged', listener);

      trackManager.reorderTracks(0, 1);
      expect(listener).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('Get Notes', () => {
    it('should get notes from track', () => {
      const track = trackManager.createTrack('Note Track');
      trackManager.addNote(track.id, { pitch: 60, start: 0, duration: 1, velocity: 100 });
      trackManager.addNote(track.id, { pitch: 64, start: 1, duration: 1, velocity: 100 });

      const notes = trackManager.getNotes(track.id);
      expect(notes.length).toBe(2);
      expect(notes[0].pitch).toBe(60);
      expect(notes[1].pitch).toBe(64);
    });

    it('should return copy of notes array', () => {
      const track = trackManager.createTrack('Note Track');
      trackManager.addNote(track.id, { pitch: 60, start: 0, duration: 1, velocity: 100 });

      const notes1 = trackManager.getNotes(track.id);
      const notes2 = trackManager.getNotes(track.id);

      expect(notes1).not.toBe(notes2);
      expect(notes1).toEqual(notes2);
    });

    it('should return empty array for non-existent track', () => {
      const notes = trackManager.getNotes('non-existent');
      expect(notes).toEqual([]);
    });
  });

  describe('Project Export/Import', () => {
    it('should export project as JSON', () => {
      const track = trackManager.createTrack('Export Track');
      trackManager.addNote(track.id, { pitch: 60, start: 0, duration: 1, velocity: 100 });

      const json = trackManager.exportProject();
      expect(typeof json).toBe('string');

      const data = JSON.parse(json);
      expect(data.tracks).toBeDefined();
      expect(data.selectedTrackId).toBeDefined();
    });

    it('should include all track data in export', () => {
      const track = trackManager.createTrack('Full Track');
      trackManager.updateTrack(track.id, { volume: 0.5, pan: -0.3, muted: true });
      trackManager.addNote(track.id, { pitch: 60, start: 0, duration: 1, velocity: 100 });

      const json = trackManager.exportProject();
      const data = JSON.parse(json);
      const exportedTrack = data.tracks[0];

      expect(exportedTrack.name).toBe('Full Track');
      expect(exportedTrack.volume).toBe(0.5);
      expect(exportedTrack.pan).toBe(-0.3);
      expect(exportedTrack.muted).toBe(true);
      expect(exportedTrack.notes.length).toBe(1);
      expect(exportedTrack.patchState).toBeDefined();
    });

    it('should import project from JSON', () => {
      // Create and export a project
      const track1 = trackManager.createTrack('Import Track 1');
      trackManager.addNote(track1.id, { pitch: 60, start: 0, duration: 1, velocity: 100 });
      const exportedJson = trackManager.exportProject();

      // Clear tracks
      trackManager.getAllTracks().forEach(t => trackManager.deleteTrack(t.id));
      expect(trackManager.getAllTracks().length).toBe(0);

      // Import the project
      trackManager.importProject(exportedJson);
      const tracks = trackManager.getAllTracks();
      expect(tracks.length).toBeGreaterThan(0);
    });

    it('should restore track properties on import', () => {
      const track = trackManager.createTrack('Test Import');
      trackManager.updateTrack(track.id, { volume: 0.6, pan: 0.4, soloed: true });
      trackManager.addNote(track.id, { pitch: 64, start: 1, duration: 2, velocity: 80 });

      const json = trackManager.exportProject();

      // Clear and reimport
      trackManager.getAllTracks().forEach(t => trackManager.deleteTrack(t.id));
      trackManager.importProject(json);

      const importedTrack = trackManager.getAllTracks()[0];
      expect(importedTrack.name).toBe('Test Import');
      expect(importedTrack.volume).toBe(0.6);
      expect(importedTrack.pan).toBe(0.4);
      expect(importedTrack.soloed).toBe(true);
      expect(importedTrack.notes.length).toBe(1);
      expect(importedTrack.notes[0].pitch).toBe(64);
    });

    it('should emit projectImported event on import', () => {
      const json = trackManager.exportProject();
      const listener = vi.fn();
      trackManager.on('projectImported', listener);

      trackManager.importProject(json);
      expect(listener).toHaveBeenCalled();
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        trackManager.importProject('invalid json {');
      }).toThrow('Invalid project file');
    });
  });

  describe('Clip Management', () => {
    let track: ITrack;

    beforeEach(() => {
      track = trackManager.createTrack('Clip Track');
    });

    it('should create a clip', () => {
      const listener = vi.fn();
      trackManager.on('clipCreated', listener);

      const clip = trackManager.createClip(track.id, 0, 4);

      expect(clip).toBeDefined();
      expect(clip.getTrackId()).toBe(track.id);
      expect(clip.getSceneIndex()).toBe(0);
      expect(clip.getLength()).toBe(4);
      expect(listener).toHaveBeenCalledWith(track.id, 0, clip);
    });

    it('should get a clip', () => {
      const clip = trackManager.createClip(track.id, 0, 4);
      const retrieved = trackManager.getClip(track.id, 0);
      expect(retrieved).toBe(clip);
    });

    it('should return undefined for non-existent clip', () => {
      const retrieved = trackManager.getClip(track.id, 5);
      expect(retrieved).toBeUndefined();
    });

    it('should return undefined for invalid track ID', () => {
      const retrieved = trackManager.getClip('invalid-id', 0);
      expect(retrieved).toBeUndefined();
    });

    it('should get all clips for a track', () => {
      const clip1 = trackManager.createClip(track.id, 0, 4);
      const clip2 = trackManager.createClip(track.id, 1, 4);

      const clips = trackManager.getAllClips(track.id);
      expect(clips).toHaveLength(2);
      expect(clips).toContain(clip1);
      expect(clips).toContain(clip2);
    });

    it('should return empty array for track with no clips', () => {
      const clips = trackManager.getAllClips(track.id);
      expect(clips).toEqual([]);
    });

    it('should delete a clip', () => {
      trackManager.createClip(track.id, 0, 4);

      const listener = vi.fn();
      trackManager.on('clipDeleted', listener);

      trackManager.deleteClip(track.id, 0);
      const retrieved = trackManager.getClip(track.id, 0);
      expect(retrieved).toBeUndefined();
      expect(listener).toHaveBeenCalledWith(track.id, 0);
    });

    it('should not emit event when deleting non-existent clip', () => {
      const listener = vi.fn();
      trackManager.on('clipDeleted', listener);

      trackManager.deleteClip(track.id, 0);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should get all clips in a scene', () => {
      const track2 = trackManager.createTrack('Track 2');

      const clip1 = trackManager.createClip(track.id, 0, 4);
      const clip2 = trackManager.createClip(track2.id, 0, 4);
      trackManager.createClip(track.id, 1, 4); // Different scene

      const sceneClips = trackManager.getClipsInScene(0);
      expect(sceneClips.size).toBe(2);
      expect(sceneClips.get(track.id)).toBe(clip1);
      expect(sceneClips.get(track2.id)).toBe(clip2);
    });

    it('should return empty map for scene with no clips', () => {
      const sceneClips = trackManager.getClipsInScene(5);
      expect(sceneClips.size).toBe(0);
    });

    it('should get scene count', () => {
      expect(trackManager.getSceneCount()).toBe(0);

      trackManager.createClip(track.id, 0, 4);
      expect(trackManager.getSceneCount()).toBe(1);

      trackManager.createClip(track.id, 2, 4);
      expect(trackManager.getSceneCount()).toBe(3);

      trackManager.createClip(track.id, 5, 4);
      expect(trackManager.getSceneCount()).toBe(6);
    });

    it('should persist clips to storage', () => {
      const clip = trackManager.createClip(track.id, 0, 4);
      clip.setName('Test Clip');

      // Export and reimport
      const json = trackManager.exportProject();
      trackManager.importProject(json);

      const restoredTrack = trackManager.getAllTracks().find(t => t.id === track.id);
      expect(restoredTrack).toBeDefined();

      const restoredClip = trackManager.getClip(restoredTrack!.id, 0);
      expect(restoredClip).toBeDefined();
      expect(restoredClip!.getName()).toBe('Test Clip');
    });
  });
});
