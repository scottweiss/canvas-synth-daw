import { TrackManager, ITrack } from '../../audio/TrackManager';
import { AudioEngine } from '../../audio/AudioEngine';
import { CsdMixerChannel } from '../csd-mixer-channel/csd-mixer-channel';
import styles from './csd-mixer.scss?inline';

export class CsdMixer extends HTMLElement {
  private trackManager: TrackManager;
  private audioEngine: AudioEngine;
  private shadowRootRef: ShadowRoot;
  private channelsContainer: HTMLDivElement;
  private masterChannel: CsdMixerChannel | null = null;
  private trackChannels: Map<string, CsdMixerChannel> = new Map();
  private meterUpdateInterval: number | null = null;

  constructor() {
    super();

    this.shadowRootRef = this.attachShadow({ mode: 'open' });
    this.trackManager = TrackManager.getInstance();
    this.audioEngine = AudioEngine.getInstance();

    this.render();
  }

  connectedCallback(): void {
    // Subscribe to track changes
    this.trackManager.on('trackAdded', this.handleTrackAdded.bind(this));
    this.trackManager.on('trackDeleted', this.handleTrackDeleted.bind(this));
    this.trackManager.on('trackUpdated', this.handleTrackUpdated.bind(this));

    // Initialize with existing tracks
    this.loadTracks();

    // Start meter updates
    this.startMeterUpdates();
  }

  disconnectedCallback(): void {
    this.stopMeterUpdates();
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = styles;

    const container = document.createElement('div');
    container.className = 'mixer';

    const header = document.createElement('div');
    header.className = 'mixer-header';

    const title = document.createElement('h3');
    title.textContent = 'Mixer';

    header.appendChild(title);

    this.channelsContainer = document.createElement('div');
    this.channelsContainer.className = 'channels-container';

    container.appendChild(header);
    container.appendChild(this.channelsContainer);

    this.shadowRootRef.appendChild(style);
    this.shadowRootRef.appendChild(container);

    // Create master channel
    this.createMasterChannel();
  }

  private createMasterChannel(): void {
    // Create a pseudo-track for master
    const masterTrack: ITrack = {
      id: 'master',
      name: 'Master',
      color: '#4ecdc4',
      notes: [],
      patch: null as any, // Master doesn't need a patch
      muted: false,
      solo: false,
      volume: 0.75,
      pan: 0
    };

    this.masterChannel = new CsdMixerChannel({
      track: masterTrack,
      isMaster: true
    });

    this.masterChannel.classList.add('master-channel');
    this.attachChannelListeners(this.masterChannel, masterTrack);
  }

  private loadTracks(): void {
    const tracks = this.trackManager.getAllTracks();

    // Clear existing channels (except master)
    this.channelsContainer.innerHTML = '';
    this.trackChannels.clear();

    // Add master channel first if it exists
    if (this.masterChannel) {
      this.channelsContainer.appendChild(this.masterChannel);
    }

    // Add track channels (they will be inserted before master)
    tracks.forEach(track => {
      this.addTrackChannel(track);
    });
  }

  private addTrackChannel(track: ITrack): void {
    const channel = new CsdMixerChannel({ track });

    this.trackChannels.set(track.id, channel);
    this.attachChannelListeners(channel, track);

    // Create audio node for this track
    const trackNode = this.audioEngine.createTrackAudioNode(track.id);
    trackNode.setVolume(track.volume);
    trackNode.setPan(track.pan);
    trackNode.setMute(track.muted);
    trackNode.setSolo(track.solo);

    // Insert before master channel if it exists and is in the DOM
    if (this.masterChannel && this.masterChannel.parentElement === this.channelsContainer) {
      this.channelsContainer.insertBefore(channel, this.masterChannel);
    } else {
      this.channelsContainer.appendChild(channel);
    }

    // Update solo/mute states to ensure proper audio routing
    // (in case other tracks are already soloed)
    this.updateSoloMuteStates();
  }

  private attachChannelListeners(channel: CsdMixerChannel, track: ITrack): void {
    channel.addEventListener('volumeChange', ((e: CustomEvent) => {
      if (track.id === 'master') {
        // Handle master volume
        this.audioEngine.setMasterVolume(e.detail.volume);
      } else {
        track.volume = e.detail.volume;
        this.trackManager.updateTrack(track.id, { volume: e.detail.volume });
        this.audioEngine.setTrackVolume(track.id, e.detail.volume);
      }
    }) as EventListener);

    channel.addEventListener('panChange', ((e: CustomEvent) => {
      if (track.id === 'master') {
        // Master doesn't have pan
        return;
      }
      track.pan = e.detail.pan;
      this.trackManager.updateTrack(track.id, { pan: e.detail.pan });
      this.audioEngine.setTrackPan(track.id, e.detail.pan);
    }) as EventListener);

    channel.addEventListener('nameChange', ((e: CustomEvent) => {
      track.name = e.detail.name;
      this.trackManager.updateTrack(track.id, { name: e.detail.name });
    }) as EventListener);

    channel.addEventListener('soloChange', ((e: CustomEvent) => {
      track.solo = e.detail.solo;
      this.trackManager.updateTrack(track.id, { solo: e.detail.solo });
      this.audioEngine.setTrackSolo(track.id, e.detail.solo);
      this.updateSoloMuteStates();
    }) as EventListener);

    channel.addEventListener('muteChange', ((e: CustomEvent) => {
      track.muted = e.detail.mute;
      this.trackManager.updateTrack(track.id, { muted: e.detail.mute });
      this.audioEngine.setTrackMute(track.id, e.detail.mute);
    }) as EventListener);
  }

  private updateSoloMuteStates(): void {
    const tracks = this.trackManager.getAllTracks();
    const anySolo = tracks.some(t => t.solo);

    tracks.forEach(track => {
      const channel = this.trackChannels.get(track.id);
      if (channel) {
        if (anySolo) {
          // If any track is soloed, mute all non-soloed tracks
          const effectivelyMuted = !track.solo;
          channel.setMute(effectivelyMuted);
          this.audioEngine.setTrackMute(track.id, effectivelyMuted);
        } else {
          // Otherwise, just use the track's mute state
          channel.setMute(track.muted);
          this.audioEngine.setTrackMute(track.id, track.muted);
        }
      }
    });
  }

  private handleTrackAdded(track: ITrack): void {
    this.addTrackChannel(track);
  }

  private handleTrackDeleted(trackId: string): void {
    const channel = this.trackChannels.get(trackId);
    if (channel) {
      channel.remove();
      this.trackChannels.delete(trackId);
    }
  }

  private handleTrackUpdated(track: ITrack): void {
    const channel = this.trackChannels.get(track.id);
    if (channel) {
      // Channel will handle its own updates via events
    }
  }

  private startMeterUpdates(): void {
    // Update meters at 30fps for smooth animation
    this.meterUpdateInterval = window.setInterval(() => {
      // Update each track's peak meter
      this.trackChannels.forEach((channel, trackId) => {
        const level = this.audioEngine.getTrackPeakLevel(trackId);
        channel.updateLevel(level);
      });

      // Update master peak meter using analyser
      if (this.masterChannel) {
        const analyser = this.audioEngine.getAnalyser();
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(dataArray);

        let max = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = Math.abs((dataArray[i] - 128) / 128);
          if (normalized > max) {
            max = normalized;
          }
        }

        this.masterChannel.updateLevel(max);
      }
    }, 1000 / 30);
  }

  private stopMeterUpdates(): void {
    if (this.meterUpdateInterval !== null) {
      window.clearInterval(this.meterUpdateInterval);
      this.meterUpdateInterval = null;
    }
  }
}

customElements.define('csd-mixer', CsdMixer);
