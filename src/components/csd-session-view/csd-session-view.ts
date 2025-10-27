import { TrackManager, ITrack } from '../../audio/TrackManager';
import { ClipRecorder } from '../../audio/ClipRecorder';
import { ClipPlayer } from '../../audio/ClipPlayer';
import { Transport } from '../../audio/Transport';
import { CsdClipSlot } from '../csd-clip-slot/csd-clip-slot';
import '../csd-clip-slot/csd-clip-slot';
import styles from './csd-session-view.scss?inline';

const SCENES_COUNT = 8;

export class CsdSessionView extends HTMLElement {
  private shadowRoot: ShadowRoot;
  private trackManager: TrackManager;
  private clipRecorder: ClipRecorder;
  private clipPlayer: ClipPlayer;
  private transport: Transport;
  private container: HTMLElement;
  private clipGrid: HTMLElement;
  private tracks: ITrack[] = [];

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: 'open' });
    this.trackManager = TrackManager.getInstance();
    this.clipRecorder = ClipRecorder.getInstance();
    this.clipPlayer = ClipPlayer.getInstance();
    this.transport = Transport.getInstance();
    this.container = document.createElement('div');
    this.clipGrid = document.createElement('div');
    this.render();
  }

  connectedCallback(): void {
    // Subscribe to track changes only (not clip state changes)
    this.trackManager.on('tracksChanged', this.handleTracksChanged.bind(this));
    this.trackManager.on('trackCreated', this.handleTracksChanged.bind(this));
    this.trackManager.on('trackDeleted', this.handleTracksChanged.bind(this));
    // Only re-render on clip creation/deletion, not state changes
    this.trackManager.on('clipCreated', this.handleClipCreated.bind(this));
    this.trackManager.on('clipDeleted', this.handleClipDeleted.bind(this));

    // Listen for clip slot events
    this.shadowRoot.addEventListener('clipRecord', ((e: CustomEvent) => {
      this.handleClipRecord(e.detail.trackId, e.detail.sceneIndex);
    }) as EventListener);

    this.shadowRoot.addEventListener('clipToggle', ((e: CustomEvent) => {
      this.handleClipToggle(e.detail.trackId, e.detail.sceneIndex, e.detail.clip);
    }) as EventListener);

    this.shadowRoot.addEventListener('clipDelete', ((e: CustomEvent) => {
      this.handleClipDelete(e.detail.trackId, e.detail.sceneIndex);
    }) as EventListener);

    // Initial load
    this.loadTracks();
    this.renderGrid();
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = styles;

    this.container.className = 'session-view';

    // Header
    const header = document.createElement('div');
    header.className = 'session-header';

    const title = document.createElement('h3');
    title.textContent = 'Session View';

    header.appendChild(title);

    // Clip grid
    this.clipGrid.className = 'clip-grid';

    this.container.appendChild(header);
    this.container.appendChild(this.clipGrid);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(this.container);
  }

  private loadTracks(): void {
    this.tracks = this.trackManager.getAllTracks();
  }

  private renderGrid(): void {
    this.clipGrid.innerHTML = '';

    if (this.tracks.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No tracks. Create a track to start.';
      this.clipGrid.appendChild(emptyState);
      return;
    }

    // Set grid columns: tracks + scene launch button
    this.clipGrid.style.gridTemplateColumns = `repeat(${this.tracks.length}, 1fr) 60px`;

    // Create clip slots for each track x scene combination
    for (let sceneIndex = 0; sceneIndex < SCENES_COUNT; sceneIndex++) {
      // Clip slots for each track
      for (const track of this.tracks) {
        const clip = this.trackManager.getClip(track.id, sceneIndex);

        const clipSlot = new CsdClipSlot({
          trackId: track.id,
          sceneIndex,
          clip
        });

        this.clipGrid.appendChild(clipSlot);
      }

      // Scene launch button
      const sceneLauncher = this.createSceneLauncher(sceneIndex);
      this.clipGrid.appendChild(sceneLauncher);
    }
  }

  private createSceneLauncher(sceneIndex: number): HTMLElement {
    const launcher = document.createElement('button');
    launcher.className = 'scene-launcher';
    launcher.textContent = `▶ ${sceneIndex + 1}`;
    launcher.title = `Launch Scene ${sceneIndex + 1}`;

    launcher.addEventListener('click', () => {
      this.launchScene(sceneIndex);
    });

    return launcher;
  }

  private launchScene(sceneIndex: number): void {
    console.log('Launching scene:', sceneIndex);

    // Get all clips in this scene
    const clipsInScene = this.trackManager.getClipsInScene(sceneIndex);

    if (clipsInScene.size === 0) {
      console.log('No clips in scene', sceneIndex);
      return;
    }

    // Start all clips in the scene
    clipsInScene.forEach((clip, trackId) => {
      if (!clip.isEmpty()) {
        this.clipPlayer.startClip(clip, trackId);
      }
    });

    // Start transport if not playing
    if (!this.transport.isPlaying()) {
      this.transport.start();
    }
  }

  private handleTracksChanged(): void {
    this.loadTracks();
    this.renderGrid();
  }

  private handleClipCreated(): void {
    // Only re-render on clip creation
    this.renderGrid();
  }

  private handleClipDeleted(): void {
    // Only re-render on clip deletion
    this.renderGrid();
  }

  private handleClipRecord(trackId: string, sceneIndex: number): void {
    console.log('Recording clip:', trackId, sceneIndex);

    // Create a new clip
    const clip = this.trackManager.createClip(trackId, sceneIndex, 4);

    // Start recording
    this.clipRecorder.startRecording(clip);

    // Auto-start transport if not playing
    if (!this.transport.isPlaying()) {
      this.transport.start();
    }

    // Auto-stop recording after clip length
    const clipLengthMs = (clip.getLength() * 60000) / this.transport.getBpm();
    setTimeout(() => {
      if (this.clipRecorder.getActiveClip() === clip) {
        this.clipRecorder.stopRecording();
      }
    }, clipLengthMs);
  }

  private handleClipToggle(trackId: string, sceneIndex: number, clip: any): void {
    console.log('Toggling clip:', trackId, sceneIndex);

    if (!clip) return;

    // Toggle clip playback
    this.clipPlayer.toggleClip(clip, trackId);
  }

  private handleClipDelete(trackId: string, sceneIndex: number): void {
    console.log('Deleting clip:', trackId, sceneIndex);
    this.trackManager.deleteClip(trackId, sceneIndex);
  }
}

customElements.define('csd-session-view', CsdSessionView);
