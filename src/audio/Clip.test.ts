import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Clip, INote } from './Clip';

describe('Clip', () => {
  let clip: Clip;
  const trackId = 'track-1';
  const sceneIndex = 0;

  beforeEach(() => {
    clip = new Clip(trackId, sceneIndex, 4);
  });

  describe('initialization', () => {
    it('should create a clip with correct initial values', () => {
      expect(clip.getTrackId()).toBe(trackId);
      expect(clip.getSceneIndex()).toBe(sceneIndex);
      expect(clip.getLength()).toBe(4);
      expect(clip.getState()).toBe('empty');
      expect(clip.getNotes()).toEqual([]);
      expect(clip.isEmpty()).toBe(true);
    });

    it('should generate a unique ID', async () => {
      // Use real timers for this test since we're testing Date.now()
      vi.useRealTimers();
      // Add tiny delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 2));
      const clip2 = new Clip(trackId, sceneIndex, 4);
      expect(clip.getId()).not.toBe(clip2.getId());
      vi.useFakeTimers();
    });

    it('should generate a color', () => {
      expect(clip.getColor()).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should have a default name', () => {
      expect(clip.getName()).toBe('Clip 1');
    });
  });

  describe('setters', () => {
    it('should set name and emit changed event', () => {
      const listener = vi.fn();
      clip.on('changed', listener);

      clip.setName('New Clip Name');
      expect(clip.getName()).toBe('New Clip Name');
      expect(listener).toHaveBeenCalledWith(clip.toJSON());
    });

    it('should set color and emit changed event', () => {
      const listener = vi.fn();
      clip.on('changed', listener);

      clip.setColor('#FF0000');
      expect(clip.getColor()).toBe('#FF0000');
      expect(listener).toHaveBeenCalledWith(clip.toJSON());
    });

    it('should set length and emit changed event', () => {
      const listener = vi.fn();
      clip.on('changed', listener);

      clip.setLength(8);
      expect(clip.getLength()).toBe(8);
      expect(listener).toHaveBeenCalledWith(clip.toJSON());
    });

    it('should set state and emit stateChanged event', () => {
      const listener = vi.fn();
      clip.on('stateChanged', listener);

      clip.setState('playing');
      expect(clip.getState()).toBe('playing');
      expect(listener).toHaveBeenCalledWith({
        oldState: 'empty',
        newState: 'playing'
      });
    });
  });

  describe('note management', () => {
    const note: INote = {
      pitch: 60,
      start: 0,
      duration: 1,
      velocity: 100
    };

    it('should add a note and emit events', () => {
      const addedListener = vi.fn();
      const changedListener = vi.fn();
      clip.on('noteAdded', addedListener);
      clip.on('changed', changedListener);

      clip.addNote(note);
      expect(clip.getNotes()).toHaveLength(1);
      expect(clip.isEmpty()).toBe(false);
      expect(addedListener).toHaveBeenCalledWith(note);
      expect(changedListener).toHaveBeenCalled();
    });

    it('should remove a note and emit events', () => {
      clip.addNote(note);

      const removedListener = vi.fn();
      const changedListener = vi.fn();
      clip.on('noteRemoved', removedListener);
      clip.on('changed', changedListener);

      clip.removeNote(0);
      expect(clip.getNotes()).toHaveLength(0);
      expect(removedListener).toHaveBeenCalledWith(note);
      expect(changedListener).toHaveBeenCalled();
    });

    it('should not remove note with invalid index', () => {
      clip.addNote(note);
      clip.removeNote(5);
      expect(clip.getNotes()).toHaveLength(1);
    });

    it('should clear all notes and emit events', () => {
      clip.addNote(note);
      clip.addNote({ ...note, pitch: 62 });

      const clearedListener = vi.fn();
      const changedListener = vi.fn();
      clip.on('cleared', clearedListener);
      clip.on('changed', changedListener);

      clip.clearNotes();
      expect(clip.getNotes()).toHaveLength(0);
      expect(clearedListener).toHaveBeenCalled();
      expect(changedListener).toHaveBeenCalled();
    });

    it('should set notes array', () => {
      const notes: INote[] = [
        { pitch: 60, start: 0, duration: 1, velocity: 100 },
        { pitch: 64, start: 1, duration: 1, velocity: 100 }
      ];

      clip.setNotes(notes);
      expect(clip.getNotes()).toEqual(notes);
    });
  });

  describe('playback control', () => {
    beforeEach(() => {
      const note: INote = { pitch: 60, start: 0, duration: 1, velocity: 100 };
      clip.addNote(note);
    });

    it('should start playback', () => {
      clip.start();
      expect(clip.getState()).toBe('playing');
      expect(clip.getCurrentPosition()).toBe(0);
    });

    it('should not start empty clip', () => {
      const emptyClip = new Clip(trackId, sceneIndex, 4);
      emptyClip.start();
      expect(emptyClip.getState()).toBe('empty');
    });

    it('should stop playback', () => {
      clip.start();
      clip.stop();
      expect(clip.getState()).toBe('stopped');
      expect(clip.getCurrentPosition()).toBe(0);
    });

    it('should pause playback', () => {
      clip.start();
      clip.pause();
      expect(clip.getState()).toBe('stopped');
    });

    it('should queue clip', () => {
      clip.queue();
      expect(clip.getState()).toBe('queued');
    });

    it('should start recording', () => {
      clip.startRecording();
      expect(clip.getState()).toBe('recording');
      expect(clip.getCurrentPosition()).toBe(0);
      expect(clip.getNotes()).toHaveLength(0); // Should clear notes
    });

    it('should stop recording', () => {
      clip.startRecording();
      clip.stopRecording();
      expect(clip.getState()).toBe('stopped');
    });
  });

  describe('position management', () => {
    it('should update position', () => {
      const listener = vi.fn();
      clip.on('positionChanged', listener);

      clip.updatePosition(2.5);
      expect(clip.getCurrentPosition()).toBe(2.5);
      expect(listener).toHaveBeenCalledWith(2.5);
    });

    it('should wrap position around clip length', () => {
      clip.updatePosition(5);
      expect(clip.getCurrentPosition()).toBe(1); // 5 % 4 = 1
    });
  });

  describe('note queries', () => {
    beforeEach(() => {
      clip.addNote({ pitch: 60, start: 0, duration: 1, velocity: 100 });
      clip.addNote({ pitch: 64, start: 1, duration: 1, velocity: 100 });
      clip.addNote({ pitch: 67, start: 2, duration: 2, velocity: 100 });
    });

    it('should get notes at position', () => {
      const notesAt2 = clip.getNotesAtPosition(2);
      expect(notesAt2).toHaveLength(1);
      expect(notesAt2[0].pitch).toBe(67);
    });

    it('should get notes to trigger', () => {
      const notesToTrigger = clip.getNotesToTrigger(1, 0.1);
      expect(notesToTrigger).toHaveLength(1);
      expect(notesToTrigger[0].pitch).toBe(64);
    });

    it('should respect tolerance for trigger', () => {
      const notesToTrigger = clip.getNotesToTrigger(0.95, 0.1);
      expect(notesToTrigger).toHaveLength(1);
      expect(notesToTrigger[0].pitch).toBe(64);
    });
  });

  describe('utility methods', () => {
    it('should duplicate clip', async () => {
      clip.setName('Original');
      clip.addNote({ pitch: 60, start: 0, duration: 1, velocity: 100 });

      // Use real timers for this test since we're testing Date.now()
      vi.useRealTimers();
      // Add tiny delay to ensure different timestamp for ID
      await new Promise(resolve => setTimeout(resolve, 2));
      const duplicate = clip.duplicate();
      expect(duplicate.getId()).not.toBe(clip.getId());
      expect(duplicate.getName()).toBe('Original (Copy)');
      expect(duplicate.getNotes()).toEqual(clip.getNotes());
      expect(duplicate.getColor()).toBe(clip.getColor());
      vi.useFakeTimers();
    });

    it('should serialize to JSON', () => {
      clip.setName('Test Clip');
      clip.addNote({ pitch: 60, start: 0, duration: 1, velocity: 100 });

      const json = clip.toJSON();
      expect(json).toMatchObject({
        trackId,
        sceneIndex,
        length: 4,
        name: 'Test Clip',
        notes: [{ pitch: 60, start: 0, duration: 1, velocity: 100 }]
      });
    });

    it('should deserialize from JSON', () => {
      const json = clip.toJSON();
      const restored = Clip.fromJSON(json);

      expect(restored.getId()).toBe(clip.getId());
      expect(restored.getTrackId()).toBe(clip.getTrackId());
      expect(restored.getSceneIndex()).toBe(clip.getSceneIndex());
      expect(restored.getLength()).toBe(clip.getLength());
    });
  });

  describe('event emitter', () => {
    it('should add and remove listeners', () => {
      const listener = vi.fn();
      clip.on('changed', listener);

      clip.setName('Test');
      expect(listener).toHaveBeenCalled();

      listener.mockClear();
      clip.off('changed', listener);

      clip.setName('Test 2');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should remove all listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      clip.on('changed', listener1);
      clip.on('stateChanged', listener2);

      clip.removeAllListeners();

      clip.setName('Test');
      clip.setState('playing');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should remove listeners for specific event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      clip.on('changed', listener1);
      clip.on('stateChanged', listener2);

      clip.removeAllListeners('changed');

      clip.setName('Test');
      clip.setState('playing');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });
});
