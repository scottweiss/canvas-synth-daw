import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SynthPatch, createSynthPatch, getDefaultPatchState } from './SynthPatch';

describe('SynthPatch', () => {
  let patch: SynthPatch;

  beforeEach(() => {
    patch = new SynthPatch();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const state = patch.getState();
      expect(state.oscillators).toHaveLength(3);
      expect(state.filter.type).toBe('lowpass');
      expect(state.envelope.attack).toBe(0.1);
      expect(state.effects.reverbMix).toBe(0.3);
      expect(state.master.volume).toBe(0.7);
      expect(state.modulation.lfoRate).toBe(2);
    });

    it('should initialize with custom state', () => {
      const customPatch = new SynthPatch({
        master: { volume: 0.5, waveType: 'sine' },
      });
      expect(customPatch.getState().master.volume).toBe(0.5);
      expect(customPatch.getState().master.waveType).toBe('sine');
    });

    it('should create patch using factory function', () => {
      const factoryPatch = createSynthPatch();
      expect(factoryPatch).toBeInstanceOf(SynthPatch);
    });

    it('should get default patch state', () => {
      const defaultState = getDefaultPatchState();
      expect(defaultState.oscillators).toHaveLength(3);
      expect(defaultState.filter.type).toBe('lowpass');
    });
  });

  describe('Get State', () => {
    it('should return immutable state copy', () => {
      const state1 = patch.getState();
      const state2 = patch.getState();
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    it('should get specific section', () => {
      const filter = patch.getSection('filter');
      expect(filter.type).toBe('lowpass');
      expect(filter.frequency).toBe(1000);
    });

    it('should return immutable section copy', () => {
      const filter1 = patch.getSection('filter');
      const filter2 = patch.getSection('filter');
      expect(filter1).not.toBe(filter2);
      expect(filter1).toEqual(filter2);
    });
  });

  describe('Oscillator Updates', () => {
    it('should update oscillator', () => {
      patch.updateOscillator(0, { type: 'sine', level: 0.8 });
      const state = patch.getState();
      expect(state.oscillators[0].type).toBe('sine');
      expect(state.oscillators[0].level).toBe(0.8);
    });

    it('should not update invalid oscillator index', () => {
      const stateBefore = patch.getState();
      patch.updateOscillator(10, { type: 'sine' });
      const stateAfter = patch.getState();
      expect(stateAfter).toEqual(stateBefore);
    });

    it('should emit oscillators event on update', () => {
      const listener = vi.fn();
      patch.on('oscillators', listener);
      patch.updateOscillator(0, { level: 0.9 });
      expect(listener).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ level: 0.9 }),
      ]));
    });
  });

  describe('Filter Updates', () => {
    it('should update filter', () => {
      patch.updateFilter({ frequency: 2000, resonance: 5 });
      const state = patch.getState();
      expect(state.filter.frequency).toBe(2000);
      expect(state.filter.resonance).toBe(5);
    });

    it('should emit filter event on update', () => {
      const listener = vi.fn();
      patch.on('filter', listener);
      patch.updateFilter({ frequency: 2000 });
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ frequency: 2000 })
      );
    });

    it('should preserve existing filter values', () => {
      patch.updateFilter({ frequency: 2000 });
      const state = patch.getState();
      expect(state.filter.type).toBe('lowpass'); // Should remain unchanged
      expect(state.filter.frequency).toBe(2000);
    });
  });

  describe('Envelope Updates', () => {
    it('should update envelope', () => {
      patch.updateEnvelope({ attack: 0.5, decay: 0.3 });
      const state = patch.getState();
      expect(state.envelope.attack).toBe(0.5);
      expect(state.envelope.decay).toBe(0.3);
    });

    it('should emit envelope event on update', () => {
      const listener = vi.fn();
      patch.on('envelope', listener);
      patch.updateEnvelope({ attack: 0.5 });
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ attack: 0.5 })
      );
    });
  });

  describe('Effects Updates', () => {
    it('should update effects', () => {
      patch.updateEffects({ reverbMix: 0.5, delayTime: 0.5 });
      const state = patch.getState();
      expect(state.effects.reverbMix).toBe(0.5);
      expect(state.effects.delayTime).toBe(0.5);
    });

    it('should emit effects event on update', () => {
      const listener = vi.fn();
      patch.on('effects', listener);
      patch.updateEffects({ reverbMix: 0.5 });
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ reverbMix: 0.5 })
      );
    });
  });

  describe('Master Updates', () => {
    it('should update master', () => {
      patch.updateMaster({ volume: 0.8, waveType: 'square' });
      const state = patch.getState();
      expect(state.master.volume).toBe(0.8);
      expect(state.master.waveType).toBe('square');
    });

    it('should emit master event on update', () => {
      const listener = vi.fn();
      patch.on('master', listener);
      patch.updateMaster({ volume: 0.8 });
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ volume: 0.8 })
      );
    });
  });

  describe('Modulation Updates', () => {
    it('should update modulation', () => {
      patch.updateModulation({ lfoRate: 5, pitchAmount: 0.5 });
      const state = patch.getState();
      expect(state.modulation.lfoRate).toBe(5);
      expect(state.modulation.pitchAmount).toBe(0.5);
    });

    it('should emit modulation event on update', () => {
      const listener = vi.fn();
      patch.on('modulation', listener);
      patch.updateModulation({ lfoRate: 5 });
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ lfoRate: 5 })
      );
    });
  });

  describe('Event Listeners', () => {
    it('should subscribe to events with on()', () => {
      const listener = vi.fn();
      const unsubscribe = patch.on('filter', listener);
      patch.updateFilter({ frequency: 2000 });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe with returned function', () => {
      const listener = vi.fn();
      const unsubscribe = patch.on('filter', listener);
      patch.updateFilter({ frequency: 2000 });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      patch.updateFilter({ frequency: 3000 });
      expect(listener).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should unsubscribe with off()', () => {
      const listener = vi.fn();
      patch.on('filter', listener);
      patch.updateFilter({ frequency: 2000 });
      expect(listener).toHaveBeenCalledTimes(1);

      patch.off('filter', listener);
      patch.updateFilter({ frequency: 3000 });
      expect(listener).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      patch.on('filter', listener1);
      patch.on('filter', listener2);
      patch.updateFilter({ frequency: 2000 });
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should only notify correct section listeners', () => {
      const filterListener = vi.fn();
      const effectsListener = vi.fn();
      patch.on('filter', filterListener);
      patch.on('effects', effectsListener);

      patch.updateFilter({ frequency: 2000 });
      expect(filterListener).toHaveBeenCalledTimes(1);
      expect(effectsListener).not.toHaveBeenCalled();
    });
  });

  describe('State Immutability', () => {
    it('should not allow direct state mutation', () => {
      const state = patch.getState();
      state.filter.frequency = 5000;
      expect(patch.getState().filter.frequency).toBe(1000); // Unchanged
    });

    it('should not allow oscillator array mutation', () => {
      const state = patch.getState();
      state.oscillators.push({ type: 'sine', detune: 0, octave: 0, level: 1 });
      expect(patch.getState().oscillators).toHaveLength(3); // Unchanged
    });
  });
});
