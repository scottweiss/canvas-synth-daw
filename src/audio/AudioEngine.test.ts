import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioEngine } from './AudioEngine';

describe('AudioEngine', () => {
  let audioEngine: AudioEngine;

  beforeEach(() => {
    audioEngine = AudioEngine.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AudioEngine.getInstance();
      const instance2 = AudioEngine.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('BPM', () => {
    it('should have default BPM of 120', () => {
      expect(audioEngine.bpm).toBe(120);
    });

    it('should set BPM', () => {
      audioEngine.bpm = 140;
      expect(audioEngine.bpm).toBe(140);
    });
  });

  describe('Master Volume', () => {
    it('should set master volume', () => {
      const masterGain = audioEngine.getMasterInput();
      audioEngine.setMasterVolume(0.5);
      expect(masterGain.gain.value).toBe(0.5);
    });

    it('should get master input node', () => {
      const masterInput = audioEngine.getMasterInput();
      expect(masterInput).toBeDefined();
      expect(masterInput.gain).toBeDefined();
    });
  });

  describe('Voice Management', () => {
    it('should get available voice', () => {
      const voice = audioEngine.getAvailableVoice();
      expect(voice).toBeDefined();
    });

    it('should play note', () => {
      audioEngine.noteOn(60, 100);
      // Voice should be in active voices
      expect(audioEngine['activeVoices'].size).toBeGreaterThan(0);
    });

    it('should stop note', () => {
      audioEngine.noteOn(60, 100);
      const sizeBefore = audioEngine['activeVoices'].size;
      audioEngine.noteOff(60);
      expect(audioEngine['activeVoices'].size).toBeLessThan(sizeBefore);
    });

    it('should handle noteOff for non-existent note', () => {
      audioEngine.noteOff(999);
      // Should not throw
      expect(true).toBe(true);
    });

    it('should stop all notes', () => {
      audioEngine.noteOn(60, 100);
      audioEngine.noteOn(64, 100);
      audioEngine.noteOn(67, 100);
      expect(audioEngine['activeVoices'].size).toBeGreaterThan(0);

      audioEngine.stopAllNotes();
      expect(audioEngine['activeVoices'].size).toBe(0);
    });

    it('should steal oldest voice when all voices are active', () => {
      const maxVoices = audioEngine['maxVoices'];

      // Fill all voices
      for (let i = 0; i < maxVoices; i++) {
        audioEngine.noteOn(60 + i, 100);
      }

      expect(audioEngine['activeVoices'].size).toBe(maxVoices);

      // Request one more voice - should steal
      audioEngine.noteOn(100, 100);
      expect(audioEngine['activeVoices'].size).toBeLessThanOrEqual(maxVoices);
    });
  });

  describe('Multi-Track Playback', () => {
    it('should play note with specific track', () => {
      const trackId = 'track-1';
      audioEngine.noteOnWithTrack(trackId, 60, 100);
      expect(audioEngine['activeVoices'].size).toBeGreaterThan(0);
    });

    it('should stop note with specific track', () => {
      // Clear any previously active voices
      audioEngine.stopAllNotes();

      const trackId = 'track-1';
      // Play note (will fail gracefully if track doesn't exist)
      audioEngine.noteOnWithTrack(trackId, 60, 100);

      // noteOff should work regardless
      audioEngine.noteOffWithTrack(trackId, 60);
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle noteOffWithTrack for non-existent note', () => {
      audioEngine.noteOffWithTrack('track-1', 999);
      // Should not throw
      expect(true).toBe(true);
    });

    it('should not play note for non-existent track', () => {
      const sizeBefore = audioEngine['activeVoices'].size;
      audioEngine.noteOnWithTrack('non-existent-track', 60, 100);
      expect(audioEngine['activeVoices'].size).toBe(sizeBefore);
    });
  });

  describe('Effects', () => {
    it('should get master reverb', () => {
      const reverb = audioEngine.getMasterReverb();
      expect(reverb).toBeDefined();
    });

    it('should get master delay', () => {
      const delay = audioEngine.getMasterDelay();
      expect(delay).toBeDefined();
    });
  });

  describe('Analyser', () => {
    it('should get analyser node', () => {
      const analyser = audioEngine.getAnalyser();
      expect(analyser).toBeDefined();
      expect(analyser.frequencyBinCount).toBeDefined();
    });

    it('should get audio data', () => {
      const data = audioEngine.getAudioData();
      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('Patch Management', () => {
    it('should get current patch', () => {
      const patch = audioEngine.getPatch();
      expect(patch).toBeDefined();
      if (patch) {
        expect(patch.getState).toBeDefined();
      }
    });
  });

  describe('Track Audio Nodes', () => {
    it('should create track audio node', () => {
      const trackNode = audioEngine.createTrackAudioNode('test-track');
      expect(trackNode).toBeDefined();
    });

    it('should get existing track audio node', () => {
      const trackId = 'test-track-2';
      const created = audioEngine.createTrackAudioNode(trackId);
      const retrieved = audioEngine.getTrackAudioNode(trackId);
      expect(retrieved).toBe(created);
    });

    it('should return undefined for non-existent track node', () => {
      const node = audioEngine.getTrackAudioNode('non-existent');
      expect(node).toBeUndefined();
    });

    it('should remove track audio node', () => {
      const trackId = 'test-track-3';
      audioEngine.createTrackAudioNode(trackId);
      expect(audioEngine.getTrackAudioNode(trackId)).toBeDefined();

      audioEngine.removeTrackAudioNode(trackId);
      expect(audioEngine.getTrackAudioNode(trackId)).toBeUndefined();
    });

    it('should set track volume', () => {
      const trackId = 'test-track-4';
      audioEngine.createTrackAudioNode(trackId);
      audioEngine.setTrackVolume(trackId, 0.5);

      const trackNode = audioEngine.getTrackAudioNode(trackId);
      expect(trackNode).toBeDefined();
    });

    it('should set track pan', () => {
      const trackId = 'test-track-5';
      audioEngine.createTrackAudioNode(trackId);
      audioEngine.setTrackPan(trackId, -0.5);

      const trackNode = audioEngine.getTrackAudioNode(trackId);
      expect(trackNode).toBeDefined();
    });

    it('should set track mute', () => {
      const trackId = 'test-track-6';
      audioEngine.createTrackAudioNode(trackId);
      audioEngine.setTrackMute(trackId, true);

      const trackNode = audioEngine.getTrackAudioNode(trackId);
      expect(trackNode).toBeDefined();
    });

    it('should set track solo', () => {
      const trackId = 'test-track-7';
      audioEngine.createTrackAudioNode(trackId);
      audioEngine.setTrackSolo(trackId, true);

      const trackNode = audioEngine.getTrackAudioNode(trackId);
      expect(trackNode).toBeDefined();
    });

    it('should get track peak level', () => {
      const trackId = 'test-track-8';
      audioEngine.createTrackAudioNode(trackId);
      const level = audioEngine.getTrackPeakLevel(trackId);
      expect(typeof level).toBe('number');
      expect(level).toBeGreaterThanOrEqual(0);
    });

    it('should get track RMS level', () => {
      const trackId = 'test-track-9';
      audioEngine.createTrackAudioNode(trackId);
      const level = audioEngine.getTrackRMSLevel(trackId);
      expect(typeof level).toBe('number');
      expect(level).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for peak level of non-existent track', () => {
      const level = audioEngine.getTrackPeakLevel('non-existent');
      expect(level).toBe(0);
    });

    it('should return 0 for RMS level of non-existent track', () => {
      const level = audioEngine.getTrackRMSLevel('non-existent');
      expect(level).toBe(0);
    });

    it('should handle setting volume on non-existent track', () => {
      audioEngine.setTrackVolume('non-existent', 0.5);
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle setting pan on non-existent track', () => {
      audioEngine.setTrackPan('non-existent', 0.5);
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle setting mute on non-existent track', () => {
      audioEngine.setTrackMute('non-existent', true);
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle setting solo on non-existent track', () => {
      audioEngine.setTrackSolo('non-existent', true);
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Voice Routing', () => {
    it('should get current voice track', () => {
      const trackId = audioEngine.getCurrentVoiceTrack();
      expect(trackId).toBeDefined();
    });

    it('should set voice routing track', () => {
      const trackId = 'routing-test-track';
      audioEngine.createTrackAudioNode(trackId);
      audioEngine.setVoiceRoutingTrack(trackId);
      expect(audioEngine.getCurrentVoiceTrack()).toBe(trackId);
    });

    it('should create track node if it does not exist when setting routing', () => {
      const trackId = 'new-routing-track';
      audioEngine.setVoiceRoutingTrack(trackId);
      const trackNode = audioEngine.getTrackAudioNode(trackId);
      expect(trackNode).toBeDefined();
    });
  });
});
