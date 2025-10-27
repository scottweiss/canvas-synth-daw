import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ClipRecorder } from './ClipRecorder';
import { Clip } from './Clip';
import { Transport } from './Transport';

describe('ClipRecorder', () => {
  let clipRecorder: ClipRecorder;
  let clip: Clip;
  let transport: Transport;

  beforeEach(() => {
    vi.useFakeTimers();
    transport = Transport.getInstance();
    transport.stop();
    transport.setPosition(0);
    transport.setBpm(120);

    clipRecorder = ClipRecorder.getInstance();
    // Ensure no recording is active from previous test
    if (clipRecorder.isRecordingActive()) {
      clipRecorder.stopRecording();
    }
    clip = new Clip('track-1', 0, 4);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ClipRecorder.getInstance();
      const instance2 = ClipRecorder.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Recording State', () => {
    it('should start recording a clip', () => {
      expect(clipRecorder.isRecordingActive()).toBe(false);

      clipRecorder.startRecording(clip);

      expect(clipRecorder.isRecordingActive()).toBe(true);
      expect(clipRecorder.getActiveClip()).toBe(clip);
      expect(clip.getState()).toBe('recording');
    });

    it('should stop recording', () => {
      clipRecorder.startRecording(clip);
      expect(clipRecorder.isRecordingActive()).toBe(true);

      clipRecorder.stopRecording();

      expect(clipRecorder.isRecordingActive()).toBe(false);
      expect(clipRecorder.getActiveClip()).toBe(null);
      expect(clip.getState()).toBe('stopped');
    });

    it('should stop previous recording when starting a new one', () => {
      const clip2 = new Clip('track-2', 0, 4);

      clipRecorder.startRecording(clip);
      expect(clipRecorder.getActiveClip()).toBe(clip);

      clipRecorder.startRecording(clip2);
      expect(clipRecorder.getActiveClip()).toBe(clip2);
      expect(clip.getState()).toBe('stopped');
      expect(clip2.getState()).toBe('recording');
    });

    it('should not stop recording if not recording', () => {
      expect(clipRecorder.isRecordingActive()).toBe(false);
      clipRecorder.stopRecording(); // Should not throw
      expect(clipRecorder.isRecordingActive()).toBe(false);
    });
  });

  describe('Note Recording', () => {
    it('should record a note when noteOn and noteOff events are dispatched', () => {
      transport.setPosition(0);
      clipRecorder.startRecording(clip);

      // Dispatch note on
      window.dispatchEvent(
        new CustomEvent('noteOn', {
          detail: { pitch: 60, velocity: 100 }
        })
      );

      // Advance transport by 1 beat (4 ticks)
      transport.setPosition(4);

      // Dispatch note off
      window.dispatchEvent(
        new CustomEvent('noteOff', {
          detail: { pitch: 60 }
        })
      );

      const notes = clip.getNotes();
      expect(notes).toHaveLength(1);
      expect(notes[0]).toMatchObject({
        pitch: 60,
        start: 0,
        duration: 1, // 1 beat
        velocity: 100
      });
    });

    it('should record multiple notes simultaneously', () => {
      transport.setPosition(0);
      clipRecorder.startRecording(clip);

      // Play chord - three notes
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 60, velocity: 100 } }));
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 64, velocity: 100 } }));
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 67, velocity: 100 } }));

      // Advance 2 beats
      transport.setPosition(8);

      // Release all notes
      window.dispatchEvent(new CustomEvent('noteOff', { detail: { pitch: 60 } }));
      window.dispatchEvent(new CustomEvent('noteOff', { detail: { pitch: 64 } }));
      window.dispatchEvent(new CustomEvent('noteOff', { detail: { pitch: 67 } }));

      const notes = clip.getNotes();
      expect(notes).toHaveLength(3);
      expect(notes[0].pitch).toBe(60);
      expect(notes[1].pitch).toBe(64);
      expect(notes[2].pitch).toBe(67);
      expect(notes[0].duration).toBe(2); // All should have 2 beat duration
    });

    it('should record notes with different velocities', () => {
      transport.setPosition(0);
      clipRecorder.startRecording(clip);

      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 60, velocity: 80 } }));
      transport.setPosition(4);
      window.dispatchEvent(new CustomEvent('noteOff', { detail: { pitch: 60 } }));

      const notes = clip.getNotes();
      expect(notes[0].velocity).toBe(80);
    });

    it('should not record notes when not recording', () => {
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 60, velocity: 100 } }));
      transport.setPosition(4);
      window.dispatchEvent(new CustomEvent('noteOff', { detail: { pitch: 60 } }));

      expect(clip.getNotes()).toHaveLength(0);
    });

    it('should not record note off without matching note on', () => {
      clipRecorder.startRecording(clip);

      // Note off without note on
      window.dispatchEvent(new CustomEvent('noteOff', { detail: { pitch: 60 } }));

      expect(clip.getNotes()).toHaveLength(0);
    });

    it('should handle overlapping notes of the same pitch', () => {
      transport.setPosition(0);
      clipRecorder.startRecording(clip);

      // First note
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 60, velocity: 100 } }));
      transport.setPosition(4); // 1 beat
      window.dispatchEvent(new CustomEvent('noteOff', { detail: { pitch: 60 } }));

      // Second note of same pitch
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 60, velocity: 100 } }));
      transport.setPosition(8); // 2 beats
      window.dispatchEvent(new CustomEvent('noteOff', { detail: { pitch: 60 } }));

      const notes = clip.getNotes();
      expect(notes).toHaveLength(2);
      expect(notes[0].start).toBe(0);
      expect(notes[0].duration).toBe(1);
      expect(notes[1].start).toBe(1);
      expect(notes[1].duration).toBe(1);
    });
  });

  describe('Recording Position', () => {
    it('should update clip position based on transport', () => {
      transport.start();
      clipRecorder.startRecording(clip);

      // Transport starts at tick 0, which is beat 0
      expect(clip.getCurrentPosition()).toBe(0);

      // Advance by 4 ticks (1 beat)
      vi.advanceTimersByTime(125 * 4); // 125ms per tick at 120 BPM

      expect(clip.getCurrentPosition()).toBe(1);
    });

    it('should calculate relative position from recording start', () => {
      transport.setPosition(4); // Start at beat 1
      clipRecorder.startRecording(clip);

      expect(clip.getCurrentPosition()).toBe(0); // Relative position should be 0

      transport.setPosition(8); // Advance to beat 2
      transport.start();
      vi.advanceTimersByTime(125); // Trigger a tick

      expect(clip.getCurrentPosition()).toBe(1); // Should be 1 beat into recording
    });
  });

  describe('Looping Recording', () => {
    it('should wrap note positions when recording beyond clip length', () => {
      transport.setPosition(0);
      clipRecorder.startRecording(clip); // 4 beat clip

      // Advance to beat 5 (1 beat past clip length)
      transport.setPosition(20); // 20 ticks = 5 beats

      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 60, velocity: 100 } }));

      transport.setPosition(24); // 6 beats
      window.dispatchEvent(new CustomEvent('noteOff', { detail: { pitch: 60 } }));

      const notes = clip.getNotes();
      expect(notes).toHaveLength(1);
      expect(notes[0].start).toBe(1); // Should wrap to beat 1 (5 % 4 = 1)
    });
  });

  describe('Stop Recording with Active Notes', () => {
    it('should finish active notes when stopping recording', () => {
      transport.setPosition(0);
      clipRecorder.startRecording(clip);

      // Start a note but don't release it
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 60, velocity: 100 } }));

      // Advance transport
      transport.setPosition(4); // 1 beat

      // Stop recording without releasing note
      clipRecorder.stopRecording();

      const notes = clip.getNotes();
      expect(notes).toHaveLength(1);
      expect(notes[0].duration).toBe(1); // Should calculate duration at stop
    });

    it('should finish multiple active notes when stopping recording', () => {
      transport.setPosition(0);
      clipRecorder.startRecording(clip);

      // Start chord
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 60, velocity: 100 } }));
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 64, velocity: 100 } }));
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 67, velocity: 100 } }));

      transport.setPosition(8); // 2 beats

      // Stop recording without releasing any notes
      clipRecorder.stopRecording();

      const notes = clip.getNotes();
      expect(notes).toHaveLength(3);
      notes.forEach(note => {
        expect(note.duration).toBe(2);
      });
    });

    it('should not add notes with zero or negative duration', () => {
      transport.setPosition(0);
      clipRecorder.startRecording(clip);

      // Start and immediately stop at same position
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 60, velocity: 100 } }));
      clipRecorder.stopRecording();

      // Note should not be added because duration would be 0
      expect(clip.getNotes()).toHaveLength(0);
    });
  });

  describe('Beat Timing', () => {
    it('should record accurate note start times', () => {
      transport.setPosition(0);
      clipRecorder.startRecording(clip);

      // First note at beat 0
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 60, velocity: 100 } }));
      transport.setPosition(4);
      window.dispatchEvent(new CustomEvent('noteOff', { detail: { pitch: 60 } }));

      // Second note at beat 1.5
      transport.setPosition(6); // 1.5 beats
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 64, velocity: 100 } }));
      transport.setPosition(8);
      window.dispatchEvent(new CustomEvent('noteOff', { detail: { pitch: 64 } }));

      const notes = clip.getNotes();
      expect(notes[0].start).toBe(0);
      expect(notes[1].start).toBe(1.5);
    });

    it('should record accurate note durations', () => {
      transport.setPosition(0);
      clipRecorder.startRecording(clip);

      // Short note (0.5 beats)
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 60, velocity: 100 } }));
      transport.setPosition(2); // 0.5 beats
      window.dispatchEvent(new CustomEvent('noteOff', { detail: { pitch: 60 } }));

      // Long note (2 beats)
      window.dispatchEvent(new CustomEvent('noteOn', { detail: { pitch: 64, velocity: 100 } }));
      transport.setPosition(10); // 2.5 beats total, so 2 beat duration
      window.dispatchEvent(new CustomEvent('noteOff', { detail: { pitch: 64 } }));

      const notes = clip.getNotes();
      expect(notes[0].duration).toBe(0.5);
      expect(notes[1].duration).toBe(2);
    });
  });
});
