export interface IMixerChannelState {
  id: string;
  label: string;
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
}

export interface IMixerState {
  channels: IMixerChannelState[];
  masterVolume: number;
}

type MixerListener = (state: IMixerState) => void;

type MixerChannelListener = (channel: IMixerChannelState) => void;

export class Mixer {
  private static instance: Mixer;

  private state: IMixerState;
  private listeners: Set<MixerListener> = new Set();
  private channelListeners: Map<string, Set<MixerChannelListener>> = new Map();

  private constructor() {
    this.state = {
      channels: [
        {
          id: 'drums',
          label: 'Drums',
          volume: 0.8,
          pan: 0,
          mute: false,
          solo: false,
        },
        {
          id: 'synth',
          label: 'Synth',
          volume: 0.9,
          pan: 0,
          mute: false,
          solo: false,
        },
        {
          id: 'sequencer',
          label: 'Sequencer',
          volume: 0.9,
          pan: 0,
          mute: false,
          solo: false,
        },
      ],
      masterVolume: 0.8,
    };
  }

  static getInstance(): Mixer {
    if (!Mixer.instance) {
      Mixer.instance = new Mixer();
    }
    return Mixer.instance;
  }

  getState(): IMixerState {
    return {
      channels: this.state.channels.map((channel) => ({ ...channel })),
      masterVolume: this.state.masterVolume,
    };
  }

  updateChannel(id: string, patch: Partial<Omit<IMixerChannelState, 'id' | 'label'>>): void {
    const channelIndex = this.state.channels.findIndex((channel) => channel.id === id);
    if (channelIndex === -1) {
      return;
    }

    const nextChannel = {
      ...this.state.channels[channelIndex],
      ...patch,
    };

    const nextChannels = this.state.channels.slice();
    nextChannels[channelIndex] = nextChannel;

    this.state = {
      ...this.state,
      channels: nextChannels,
    };

    this.emit();
    this.emitChannel(nextChannel);
  }

  setMasterVolume(volume: number): void {
    this.state = {
      ...this.state,
      masterVolume: volume,
    };
    this.emit();
  }

  onChange(listener: MixerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onChannelChange(channelId: string, listener: MixerChannelListener): () => void {
    const listeners = this.channelListeners.get(channelId) ?? new Set<MixerChannelListener>();
    listeners.add(listener);
    this.channelListeners.set(channelId, listeners);

    return () => {
      const channelListeners = this.channelListeners.get(channelId);
      channelListeners?.delete(listener);
    };
  }

  private emit(): void {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private emitChannel(channel: IMixerChannelState): void {
    const listeners = this.channelListeners.get(channel.id);
    if (!listeners) {
      return;
    }
    listeners.forEach((listener) => listener({ ...channel }));
  }
}
