import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Mixer, MixerState, MixerChannelState } from './Mixer';

describe('Mixer', () => {
  let mixer: Mixer;

  beforeEach(() => {
    mixer = Mixer.getInstance();
    // Reset to default state
    mixer.setMasterVolume(0.8);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = Mixer.getInstance();
      const instance2 = Mixer.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initial State', () => {
    it('should have default channels', () => {
      const state = mixer.getState();
      expect(state.channels.length).toBe(3);
      expect(state.channels[0].id).toBe('drums');
      expect(state.channels[1].id).toBe('synth');
      expect(state.channels[2].id).toBe('sequencer');
    });

    it('should have default master volume', () => {
      const state = mixer.getState();
      expect(state.masterVolume).toBe(0.8);
    });

    it('should have default channel properties', () => {
      const state = mixer.getState();
      const drumsChannel = state.channels.find(ch => ch.id === 'drums');

      expect(drumsChannel).toBeDefined();
      expect(drumsChannel?.label).toBe('Drums');
      expect(drumsChannel?.volume).toBe(0.8);
      expect(drumsChannel?.pan).toBe(0);
      expect(drumsChannel?.mute).toBe(false);
      expect(drumsChannel?.solo).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should return a copy of state (not reference)', () => {
      const state1 = mixer.getState();
      const state2 = mixer.getState();

      expect(state1).not.toBe(state2);
      expect(state1.channels).not.toBe(state2.channels);
      expect(state1).toEqual(state2);
    });
  });

  describe('Master Volume', () => {
    it('should set master volume', () => {
      mixer.setMasterVolume(0.5);
      const state = mixer.getState();
      expect(state.masterVolume).toBe(0.5);
    });

    it('should emit change on master volume update', () => {
      const listener = vi.fn();
      mixer.onChange(listener);

      mixer.setMasterVolume(0.6);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          masterVolume: 0.6
        })
      );
    });
  });

  describe('Channel Updates', () => {
    it('should update channel volume', () => {
      mixer.updateChannel('drums', { volume: 0.5 });
      const state = mixer.getState();
      const drumsChannel = state.channels.find(ch => ch.id === 'drums');

      expect(drumsChannel?.volume).toBe(0.5);
    });

    it('should update channel pan', () => {
      mixer.updateChannel('synth', { pan: -0.5 });
      const state = mixer.getState();
      const synthChannel = state.channels.find(ch => ch.id === 'synth');

      expect(synthChannel?.pan).toBe(-0.5);
    });

    it('should update channel mute', () => {
      mixer.updateChannel('sequencer', { mute: true });
      const state = mixer.getState();
      const sequencerChannel = state.channels.find(ch => ch.id === 'sequencer');

      expect(sequencerChannel?.mute).toBe(true);
    });

    it('should update channel solo', () => {
      mixer.updateChannel('drums', { solo: true });
      const state = mixer.getState();
      const drumsChannel = state.channels.find(ch => ch.id === 'drums');

      expect(drumsChannel?.solo).toBe(true);
    });

    it('should update multiple properties at once', () => {
      mixer.updateChannel('synth', {
        volume: 0.7,
        pan: 0.3,
        mute: true
      });
      const state = mixer.getState();
      const synthChannel = state.channels.find(ch => ch.id === 'synth');

      expect(synthChannel?.volume).toBe(0.7);
      expect(synthChannel?.pan).toBe(0.3);
      expect(synthChannel?.mute).toBe(true);
    });

    it('should not update non-existent channel', () => {
      const stateBefore = mixer.getState();
      mixer.updateChannel('non-existent', { volume: 0.5 });
      const stateAfter = mixer.getState();

      expect(stateAfter).toEqual(stateBefore);
    });

    it('should preserve other channel properties on update', () => {
      const stateBefore = mixer.getState();
      const drumsChannelBefore = stateBefore.channels.find(ch => ch.id === 'drums');

      mixer.updateChannel('drums', { volume: 0.3 });
      const stateAfter = mixer.getState();
      const drumsChannelAfter = stateAfter.channels.find(ch => ch.id === 'drums');

      expect(drumsChannelAfter?.label).toBe(drumsChannelBefore?.label);
      expect(drumsChannelAfter?.pan).toBe(drumsChannelBefore?.pan);
      expect(drumsChannelAfter?.mute).toBe(drumsChannelBefore?.mute);
      expect(drumsChannelAfter?.solo).toBe(drumsChannelBefore?.solo);
      expect(drumsChannelAfter?.volume).toBe(0.3); // Changed
    });
  });

  describe('Event Listeners', () => {
    it('should emit state change on channel update', () => {
      const listener = vi.fn();
      mixer.onChange(listener);

      mixer.updateChannel('drums', { volume: 0.4 });
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          channels: expect.any(Array)
        })
      );
    });

    it('should emit to multiple state listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      mixer.onChange(listener1);
      mixer.onChange(listener2);

      mixer.setMasterVolume(0.7);
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should unsubscribe state listener', () => {
      const listener = vi.fn();
      const unsubscribe = mixer.onChange(listener);

      mixer.setMasterVolume(0.5);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      mixer.setMasterVolume(0.6);
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should emit channel-specific change', () => {
      const listener = vi.fn();
      mixer.onChannelChange('drums', listener);

      mixer.updateChannel('drums', { volume: 0.3 });
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'drums',
          volume: 0.3
        })
      );
    });

    it('should not emit channel change for other channels', () => {
      const drumsListener = vi.fn();
      const synthListener = vi.fn();
      mixer.onChannelChange('drums', drumsListener);
      mixer.onChannelChange('synth', synthListener);

      mixer.updateChannel('drums', { volume: 0.3 });
      expect(drumsListener).toHaveBeenCalled();
      expect(synthListener).not.toHaveBeenCalled();
    });

    it('should unsubscribe channel listener', () => {
      const listener = vi.fn();
      const unsubscribe = mixer.onChannelChange('synth', listener);

      mixer.updateChannel('synth', { volume: 0.4 });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      mixer.updateChannel('synth', { volume: 0.5 });
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should handle multiple channel listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      mixer.onChannelChange('drums', listener1);
      mixer.onChannelChange('drums', listener2);

      mixer.updateChannel('drums', { mute: true });
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should not emit channel change for non-existent channel', () => {
      const listener = vi.fn();
      mixer.onChannelChange('non-existent', listener);

      mixer.updateChannel('non-existent', { volume: 0.5 });
      expect(listener).not.toHaveBeenCalled();
    });

    it('should return immutable channel copy to listeners', () => {
      const listener = vi.fn();
      mixer.onChannelChange('drums', listener);

      mixer.updateChannel('drums', { volume: 0.4 });
      const receivedChannel = listener.mock.calls[0][0] as MixerChannelState;

      // Modify received object
      receivedChannel.volume = 0.9;

      // Original state should not change
      const state = mixer.getState();
      const drumsChannel = state.channels.find(ch => ch.id === 'drums');
      expect(drumsChannel?.volume).toBe(0.4);
    });
  });
});
