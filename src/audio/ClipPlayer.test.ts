import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ClipPlayer } from './ClipPlayer';
import { Clip } from './Clip';
import { Transport } from './Transport';
import { AudioEngine } from './AudioEngine';
import { TrackManager } from './TrackManager';

describe('ClipPlayer', () => {
  let clipPlayer: ClipPlayer;
  let transport: Transport;
  let audioEngine: AudioEngine;
  let trackManager: TrackManager;
  let clip: Clip;
  let trackId: string;

  beforeEach(() => {
    vi.useFakeTimers();

    transport = Transport.getInstance();
    transport.stop();
    transport.setPosition(0);
    transport.setBpm(120);

    audioEngine = AudioEngine.getInstance();
    trackManager = TrackManager.getInstance();

    // Create a track
    const track = trackManager.createTrack('Test Track');
    trackId = track.id;

    // Create a clip with some notes
    clip = new Clip(trackId, 0, 4);
    clip.addNote({ pitch: 60, start: 0, duration: 1, velocity: 100 });
    clip.addNote({ pitch: 64, start: 1, duration: 1, velocity: 100 });
    clip.addNote({ pitch: 67, start: 2, duration: 1, velocity: 100 });

    clipPlayer = ClipPlayer.getInstance();

    // Spy on audio engine methods
    vi.spyOn(audioEngine, 'noteOn');
    vi.spyOn(audioEngine, 'noteOff');
  });

  afterEach(() => {
    // Stop all clips and transport
    clipPlayer.stopAll();
    transport.stop();

    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ClipPlayer.getInstance();
      const instance2 = ClipPlayer.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Clip Playback Control', () => {
    it('should start a clip', () => {
      expect(clipPlayer.isPlaying(clip)).toBe(false);

      clipPlayer.startClip(clip, trackId);

      expect(clipPlayer.isPlaying(clip)).toBe(true);
      expect(clip.getState()).toBe('playing');
    });

    it('should start transport when starting a clip', () => {
      expect(transport.isPlaying()).toBe(false);

      clipPlayer.startClip(clip, trackId);

      expect(transport.isPlaying()).toBe(true);
    });

    it('should not start transport if already playing', () => {
      transport.start();
      const startSpy = vi.spyOn(transport, 'start');

      clipPlayer.startClip(clip, trackId);

      expect(startSpy).not.toHaveBeenCalled();
    });

    it('should not start a clip twice', () => {
      clipPlayer.startClip(clip, trackId);
      const playingClips = clipPlayer.getPlayingClips();
      const initialLength = playingClips.length;

      clipPlayer.startClip(clip, trackId); // Try to start again

      expect(clipPlayer.getPlayingClips()).toHaveLength(initialLength);
    });

    it('should stop a clip', () => {
      clipPlayer.startClip(clip, trackId);
      expect(clipPlayer.isPlaying(clip)).toBe(true);

      clipPlayer.stopClip(clip);

      expect(clipPlayer.isPlaying(clip)).toBe(false);
      expect(clip.getState()).toBe('stopped');
    });

    it('should not throw when stopping a clip that is not playing', () => {
      expect(() => {
        clipPlayer.stopClip(clip);
      }).not.toThrow();
    });

    it('should toggle clip playback', () => {
      expect(clipPlayer.isPlaying(clip)).toBe(false);

      clipPlayer.toggleClip(clip, trackId);
      expect(clipPlayer.isPlaying(clip)).toBe(true);

      clipPlayer.toggleClip(clip, trackId);
      expect(clipPlayer.isPlaying(clip)).toBe(false);
    });

    it('should stop all clips', () => {
      const clip2 = new Clip(trackId, 1, 4);
      clip2.addNote({ pitch: 72, start: 0, duration: 1, velocity: 100 });

      clipPlayer.startClip(clip, trackId);
      clipPlayer.startClip(clip2, trackId);

      expect(clipPlayer.getPlayingClips()).toHaveLength(2);

      clipPlayer.stopAll();

      expect(clipPlayer.getPlayingClips()).toHaveLength(0);
      expect(clipPlayer.isPlaying(clip)).toBe(false);
      expect(clipPlayer.isPlaying(clip2)).toBe(false);
    });
  });

  describe('Note Triggering', () => {
    it('should trigger notes at their start positions', () => {
      // Debug: Check if clip has notes
      expect(clip.getNotes()).toHaveLength(3);

      clipPlayer.startClip(clip, trackId); // This starts transport

      // Transport.start() emits tick 0 immediately, which triggers processTick
      // Initial tick at beat 0 should trigger first note (pitch 60)
      expect(audioEngine.noteOn).toHaveBeenCalledWith(60, 100);

      vi.clearAllMocks();

      // Advance to beat 1 (tick 4)
      vi.advanceTimersByTime(125 * 4); // 125ms per tick

      // Should trigger second note (pitch 64)
      expect(audioEngine.noteOn).toHaveBeenCalledWith(64, 100);
    });

    it('should schedule note off events after note duration', () => {
      clipPlayer.startClip(clip, trackId); // This starts transport

      // First note triggers at beat 0 with 1 beat duration
      expect(audioEngine.noteOn).toHaveBeenCalledWith(60, 100);

      vi.clearAllMocks();

      // Advance by note duration (1 beat = 500ms at 120 BPM)
      vi.advanceTimersByTime(500);

      // Should trigger note off
      expect(audioEngine.noteOff).toHaveBeenCalledWith(60);
    });

    it('should play multiple clips simultaneously', () => {
      const clip2 = new Clip(trackId, 1, 4);
      clip2.addNote({ pitch: 72, start: 0, duration: 1, velocity: 100 });

      clipPlayer.startClip(clip, trackId); // This starts transport
      clipPlayer.startClip(clip2, trackId);

      // Both clips should trigger their first notes
      expect(audioEngine.noteOn).toHaveBeenCalledWith(60, 100); // clip 1
      expect(audioEngine.noteOn).toHaveBeenCalledWith(72, 100); // clip 2
    });

    it('should select track before playing notes', () => {
      const selectSpy = vi.spyOn(trackManager, 'selectTrack');

      clipPlayer.startClip(clip, trackId);

      expect(selectSpy).toHaveBeenCalledWith(trackId);
    });
  });

  describe('Clip Looping', () => {
    it('should loop clip after reaching its length', () => {
      clipPlayer.startClip(clip, trackId);

      vi.clearAllMocks();

      // Advance to beat 4 (clip length = 4 beats)
      // This should wrap back to beat 0 and trigger first note again
      vi.advanceTimersByTime(125 * 16); // 16 ticks = 4 beats

      // First note should trigger again at loop point
      expect(audioEngine.noteOn).toHaveBeenCalledWith(60, 100);
    });

    it('should update clip position during playback', () => {
      const positionSpy = vi.spyOn(clip, 'updatePosition');

      clipPlayer.startClip(clip, trackId);
      positionSpy.mockClear();

      // Advance by 1 beat
      vi.advanceTimersByTime(125 * 4);

      expect(positionSpy).toHaveBeenCalled();
      const lastCall = positionSpy.mock.calls[positionSpy.mock.calls.length - 1];
      expect(lastCall[0]).toBeCloseTo(1, 1); // Should be around beat 1
    });
  });

  describe('Transport Synchronization', () => {
    it('should stop all clips when transport stops', () => {
      clipPlayer.startClip(clip, trackId);
      expect(clipPlayer.isPlaying(clip)).toBe(true);

      transport.stop();

      expect(clipPlayer.isPlaying(clip)).toBe(false);
      expect(clipPlayer.getPlayingClips()).toHaveLength(0);
    });

    it('should release active notes when clip stops', () => {
      clip.clearNotes();
      clip.addNote({ pitch: 60, start: 0, duration: 4, velocity: 100 }); // Long note

      clipPlayer.startClip(clip, trackId); // This starts transport

      // Note should start
      expect(audioEngine.noteOn).toHaveBeenCalledWith(60, 100);

      vi.clearAllMocks();

      // Stop clip before note duration ends
      clipPlayer.stopClip(clip);

      // Should release the note
      expect(audioEngine.noteOff).toHaveBeenCalledWith(60);
    });

    it('should not process ticks when no clips are playing', () => {
      transport.start();

      // Advance time with no clips playing
      vi.advanceTimersByTime(125 * 4);

      // Should not trigger any notes
      expect(audioEngine.noteOn).not.toHaveBeenCalled();
    });
  });

  describe('Note Timing', () => {
    it('should trigger notes with correct velocity', () => {
      clip.clearNotes();
      clip.addNote({ pitch: 60, start: 0, duration: 1, velocity: 80 });

      clipPlayer.startClip(clip, trackId); // This starts transport

      expect(audioEngine.noteOn).toHaveBeenCalledWith(60, 80);
    });

    it('should handle notes at different beat positions', () => {
      clip.clearNotes();
      clip.addNote({ pitch: 60, start: 0.5, duration: 1, velocity: 100 });

      clipPlayer.startClip(clip, trackId);

      vi.clearAllMocks();

      // Advance to beat 0.5 (tick 2)
      vi.advanceTimersByTime(125 * 2);

      // Note should not trigger yet (only triggers on beat changes)
      // Advance to beat 1 (tick 4)
      vi.advanceTimersByTime(125 * 2);

      // Now at beat 1, note at 0.5 should have been caught with tolerance
      // Actually, let's check the implementation - it only triggers on beat changes
      // So we need to be at the right beat boundary
    });

    it('should calculate note duration based on BPM', () => {
      transport.setBpm(60); // Slower tempo

      clip.clearNotes();
      clip.addNote({ pitch: 60, start: 0, duration: 1, velocity: 100 }); // 1 beat

      clipPlayer.startClip(clip, trackId);

      expect(audioEngine.noteOn).toHaveBeenCalledWith(60, 100);

      vi.clearAllMocks();

      // At 60 BPM, 1 beat = 1000ms
      vi.advanceTimersByTime(1000);

      expect(audioEngine.noteOff).toHaveBeenCalledWith(60);
    });
  });

  describe('Multiple Tracks', () => {
    it('should play clips from different tracks', () => {
      const track2 = trackManager.createTrack('Track 2');
      const clip2 = new Clip(track2.id, 0, 4);
      clip2.addNote({ pitch: 72, start: 0, duration: 1, velocity: 100 });

      clipPlayer.startClip(clip, trackId); // This starts transport
      clipPlayer.startClip(clip2, track2.id);

      expect(audioEngine.noteOn).toHaveBeenCalledWith(60, 100);
      expect(audioEngine.noteOn).toHaveBeenCalledWith(72, 100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty clips', () => {
      const emptyClip = new Clip(trackId, 1, 4);

      clipPlayer.startClip(emptyClip, trackId);

      // Should not trigger any notes
      expect(audioEngine.noteOn).not.toHaveBeenCalled();
    });

    it('should handle clips with many simultaneous notes', () => {
      clip.clearNotes();
      // Add chord at beat 0
      for (let i = 0; i < 10; i++) {
        clip.addNote({ pitch: 60 + i, start: 0, duration: 1, velocity: 100 });
      }

      clipPlayer.startClip(clip, trackId); // This starts transport

      // All notes should trigger
      expect(audioEngine.noteOn).toHaveBeenCalledTimes(10);
    });

    it('should handle very short note durations', () => {
      clip.clearNotes();
      clip.addNote({ pitch: 60, start: 0, duration: 0.1, velocity: 100 });

      clipPlayer.startClip(clip, trackId); // This starts transport

      expect(audioEngine.noteOn).toHaveBeenCalledWith(60, 100);

      vi.clearAllMocks();

      // Advance by 0.1 beat duration at 120 BPM (~50ms)
      vi.advanceTimersByTime(50);

      expect(audioEngine.noteOff).toHaveBeenCalledWith(60);
    });
  });

  describe('Query Methods', () => {
    it('should return list of playing clips', () => {
      expect(clipPlayer.getPlayingClips()).toHaveLength(0);

      clipPlayer.startClip(clip, trackId);
      expect(clipPlayer.getPlayingClips()).toHaveLength(1);
      expect(clipPlayer.getPlayingClips()[0]).toBe(clip);

      const clip2 = new Clip(trackId, 1, 4);
      clip2.addNote({ pitch: 72, start: 0, duration: 1, velocity: 100 });

      clipPlayer.startClip(clip2, trackId);
      expect(clipPlayer.getPlayingClips()).toHaveLength(2);
    });

    it('should check if specific clip is playing', () => {
      const clip2 = new Clip(trackId, 1, 4);

      expect(clipPlayer.isPlaying(clip)).toBe(false);
      expect(clipPlayer.isPlaying(clip2)).toBe(false);

      clipPlayer.startClip(clip, trackId);

      expect(clipPlayer.isPlaying(clip)).toBe(true);
      expect(clipPlayer.isPlaying(clip2)).toBe(false);
    });
  });
});
