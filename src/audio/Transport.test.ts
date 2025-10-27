import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Transport } from './Transport';

describe('Transport', () => {
  let transport: Transport;

  beforeEach(() => {
    // Reset the singleton instance before each test
    vi.useFakeTimers();
    transport = Transport.getInstance();
    transport.stop();
    transport.setPosition(0);
    transport.setBpm(120); // Reset to default
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = Transport.getInstance();
      const instance2 = Transport.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Start/Stop', () => {
    it('should start transport', () => {
      expect(transport.isPlaying()).toBe(false);
      transport.start();
      expect(transport.isPlaying()).toBe(true);
    });

    it('should stop transport', () => {
      transport.start();
      expect(transport.isPlaying()).toBe(true);
      transport.stop();
      expect(transport.isPlaying()).toBe(false);
    });

    it('should toggle transport state', () => {
      expect(transport.isPlaying()).toBe(false);
      transport.toggle();
      expect(transport.isPlaying()).toBe(true);
      transport.toggle();
      expect(transport.isPlaying()).toBe(false);
    });

    it('should not start twice', () => {
      transport.start();
      const ticksBefore = transport.getCurrentTick();
      transport.start(); // Should be ignored
      expect(transport.getCurrentTick()).toBe(ticksBefore);
    });

    it('should not stop twice', () => {
      transport.start();
      transport.stop();
      expect(transport.isPlaying()).toBe(false);
      transport.stop(); // Should be ignored
      expect(transport.isPlaying()).toBe(false);
    });
  });

  describe('BPM', () => {
    it('should have default BPM of 120', () => {
      expect(transport.getBpm()).toBe(120);
    });

    it('should set BPM', () => {
      transport.setBpm(140);
      expect(transport.getBpm()).toBe(140);
    });

    it('should not emit BPM change if value is same', () => {
      const listener = vi.fn();
      transport.setBpm(140); // Change to different value
      transport.onBpmChange(listener);
      transport.setBpm(140); // Same as current
      expect(listener).not.toHaveBeenCalled();
    });

    it('should emit BPM change', () => {
      const listener = vi.fn();
      transport.onBpmChange(listener);
      transport.setBpm(140);
      expect(listener).toHaveBeenCalledWith(140);
    });
  });

  describe('Ticks', () => {
    it('should start at tick 0', () => {
      expect(transport.getCurrentTick()).toBe(0);
      transport.start();
      expect(transport.getCurrentTick()).toBe(0);
    });

    it('should emit tick events', () => {
      const tickListener = vi.fn();
      transport.onTick(tickListener);
      transport.start();

      // First tick is emitted immediately
      expect(tickListener).toHaveBeenCalledWith(0, expect.any(Number));

      // Advance time by one beat interval (120 BPM = 500ms per beat / 4 = 125ms)
      vi.advanceTimersByTime(125);
      expect(tickListener).toHaveBeenCalledWith(1, expect.any(Number));
    });

    it('should loop after 16 ticks', () => {
      const tickListener = vi.fn();
      transport.onTick(tickListener);
      transport.start();

      // Start is tick 0, advance through 15 more ticks to complete the loop
      for (let i = 0; i < 15; i++) {
        vi.advanceTimersByTime(125);
      }

      // Should be at tick 15
      expect(transport.getCurrentTick()).toBe(15);

      // Advance one more time
      vi.advanceTimersByTime(125);

      // Should wrap to tick 0
      expect(transport.getCurrentTick()).toBe(0);
    });

    it('should set position', () => {
      transport.setPosition(5);
      expect(transport.getCurrentTick()).toBe(5);
    });

    it('should clamp negative positions to 0', () => {
      transport.setPosition(-1);
      expect(transport.getCurrentTick()).toBe(0);
    });

    it('should wrap position over 16', () => {
      transport.setPosition(20);
      expect(transport.getCurrentTick()).toBe(4); // 20 % 16
    });
  });

  describe('State Listeners', () => {
    it('should emit state change on start', () => {
      const listener = vi.fn();
      transport.onStateChange(listener);
      transport.start();
      expect(listener).toHaveBeenCalledWith(true);
    });

    it('should emit state change on stop', () => {
      const listener = vi.fn();
      transport.start();
      transport.onStateChange(listener);
      transport.stop();
      expect(listener).toHaveBeenCalledWith(false);
    });

    it('should unsubscribe tick listener', () => {
      const listener = vi.fn();
      const unsubscribe = transport.onTick(listener);
      transport.start();
      expect(listener).toHaveBeenCalled();

      listener.mockClear();
      unsubscribe();

      vi.advanceTimersByTime(125);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should unsubscribe state listener', () => {
      const listener = vi.fn();
      const unsubscribe = transport.onStateChange(listener);
      unsubscribe();

      transport.start();
      expect(listener).not.toHaveBeenCalled();
    });

    it('should unsubscribe BPM listener', () => {
      const listener = vi.fn();
      const unsubscribe = transport.onBpmChange(listener);
      unsubscribe();

      transport.setBpm(140);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Timing', () => {
    it('should use correct interval for 120 BPM', () => {
      // 120 BPM = 120 beats per minute = 2 beats per second
      // 4 ticks per beat = 8 ticks per second = 125ms per tick
      const listener = vi.fn();
      transport.onTick(listener);
      transport.start();

      listener.mockClear();
      vi.advanceTimersByTime(125);
      expect(listener).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(125);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should use correct interval for 140 BPM', () => {
      // 140 BPM = ~107ms per tick
      transport.setBpm(140);
      const listener = vi.fn();
      transport.onTick(listener);
      transport.start();

      listener.mockClear();
      vi.advanceTimersByTime(107);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should reschedule ticks when BPM changes during playback', () => {
      const listener = vi.fn();
      transport.onTick(listener);
      transport.start();

      listener.mockClear();
      transport.setBpm(60); // Slower = 250ms per tick

      vi.advanceTimersByTime(250);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Beat Conversion', () => {
    it('should convert ticks to beats', () => {
      expect(transport.tickToBeat(0)).toBe(0);
      expect(transport.tickToBeat(4)).toBe(1);
      expect(transport.tickToBeat(8)).toBe(2);
      expect(transport.tickToBeat(16)).toBe(4);
    });

    it('should convert beats to ticks', () => {
      expect(transport.beatToTick(0)).toBe(0);
      expect(transport.beatToTick(1)).toBe(4);
      expect(transport.beatToTick(2)).toBe(8);
      expect(transport.beatToTick(4)).toBe(16);
    });

    it('should handle fractional beats', () => {
      expect(transport.tickToBeat(2)).toBe(0.5);
      expect(transport.tickToBeat(6)).toBe(1.5);
    });

    it('should handle fractional ticks', () => {
      expect(transport.beatToTick(0.5)).toBe(2);
      expect(transport.beatToTick(1.5)).toBe(6);
    });

    it('should get current beat from current tick', () => {
      transport.setPosition(0);
      expect(transport.getCurrentBeat()).toBe(0);

      transport.setPosition(4);
      expect(transport.getCurrentBeat()).toBe(1);

      transport.setPosition(8);
      expect(transport.getCurrentBeat()).toBe(2);
    });
  });
});
