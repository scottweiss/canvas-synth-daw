import { TrackManager, ITrack } from '../../audio/TrackManager';
import { ArrangementClip } from '../../audio/ArrangementClip';
import { CsdTimeline } from '../csd-timeline/csd-timeline';
import { CsdArrangementTrack } from '../csd-arrangement-track/csd-arrangement-track';
import '../csd-timeline/csd-timeline';
import '../csd-arrangement-track/csd-arrangement-track';
import styles from './csd-arrangement-view.scss?inline';

export class CsdArrangementView extends HTMLElement {
  private shadowRootRef: ShadowRoot;
  private trackManager: TrackManager;
  private container: HTMLDivElement;
  private timeline: CsdTimeline;
  private tracksContainer: HTMLDivElement;
  private trackElements: Map<string, CsdArrangementTrack> = new Map();
  private tracks: ITrack[] = [];

  constructor() {
    super();
    this.shadowRootRef = this.attachShadow({ mode: 'open' });
    this.trackManager = TrackManager.getInstance();
    this.container = document.createElement('div');
    this.timeline = new CsdTimeline();
    this.tracksContainer = document.createElement('div');
    this.render();
  }

  connectedCallback(): void {
    // Subscribe to track changes
    this.trackManager.on('trackCreated', this.handleTracksChanged.bind(this));
    this.trackManager.on('trackDeleted', this.handleTracksChanged.bind(this));
    this.trackManager.on('arrangementClipCreated', this.handleClipCreated.bind(this));
    this.trackManager.on('arrangementClipDeleted', this.handleClipDeleted.bind(this));

    // Listen for timeline events
    this.timeline.addEventListener('timelinePan', ((e: CustomEvent) => {
      this.handleTimelineChange(e.detail.viewportStart, e.detail.beatsPerPixel);
    }) as EventListener);

    this.timeline.addEventListener('timelineZoom', ((e: CustomEvent) => {
      this.handleTimelineChange(
        this.timeline.getViewportInfo().start,
        e.detail.beatsPerPixel
      );
    }) as EventListener);

    // Listen for clip creation
    this.shadowRootRef.addEventListener('createClip', (event) => {
      const detail = (event as CustomEvent<{ trackId: string; startTime: number }>).detail;
      this.handleCreateClip(detail.trackId, detail.startTime);
    });

    // Initial load
    this.loadTracks();
    this.renderTracks();
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = styles;

    this.container.className = 'arrangement-view';

    // Header
    const header = document.createElement('div');
    header.className = 'arrangement-header';

    const title = document.createElement('h3');
    title.textContent = 'Arrangement View';

    const controls = document.createElement('div');
    controls.className = 'arrangement-controls';

    // Zoom controls
    const zoomIn = document.createElement('button');
    zoomIn.textContent = '+';
    zoomIn.title = 'Zoom In';
    zoomIn.addEventListener('click', () => this.zoom(0.9));

    const zoomOut = document.createElement('button');
    zoomOut.textContent = '-';
    zoomOut.title = 'Zoom Out';
    zoomOut.addEventListener('click', () => this.zoom(1.1));

    controls.appendChild(zoomOut);
    controls.appendChild(zoomIn);

    header.appendChild(title);
    header.appendChild(controls);

    // Timeline
    this.timeline.style.gridColumn = '1 / -1';

    // Tracks container
    this.tracksContainer.className = 'tracks-container';

    this.container.appendChild(header);
    this.container.appendChild(this.timeline);
    this.container.appendChild(this.tracksContainer);

    this.shadowRootRef.appendChild(style);
    this.shadowRootRef.appendChild(this.container);
  }

  private loadTracks(): void {
    this.tracks = this.trackManager.getAllTracks();
  }

  private renderTracks(): void {
    this.tracksContainer.innerHTML = '';
    this.trackElements.clear();

    if (this.tracks.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No tracks. Create a track to start.';
      this.tracksContainer.appendChild(emptyState);
      return;
    }

    // Render each track
    this.tracks.forEach(track => {
      const trackEl = new CsdArrangementTrack(track);
      const viewport = this.timeline.getViewportInfo();
      trackEl.updateViewport(viewport.start, viewport.beatsPerPixel);

      this.tracksContainer.appendChild(trackEl);
      this.trackElements.set(track.id, trackEl);
    });
  }

  private handleTracksChanged(): void {
    this.loadTracks();
    this.renderTracks();
  }

  private handleClipCreated(trackId: string, clip: ArrangementClip): void {
    const trackEl = this.trackElements.get(trackId);
    if (trackEl) {
      trackEl.addClip(clip);
    }
  }

  private handleClipDeleted(trackId: string, clipId: string): void {
    const trackEl = this.trackElements.get(trackId);
    if (trackEl) {
      trackEl.removeClip(clipId);
    }
  }

  private handleTimelineChange(viewportStart: number, beatsPerPixel: number): void {
    // Update all tracks with new viewport
    this.trackElements.forEach(trackEl => {
      trackEl.updateViewport(viewportStart, beatsPerPixel);
    });
  }

  private handleCreateClip(trackId: string, startTime: number): void {
    // Create a 4-beat clip
    const clip = this.trackManager.createArrangementClip(trackId, startTime, 4);

    // Optionally add some default notes
    clip.addNote({ pitch: 60, start: 0, duration: 1, velocity: 100 });
    clip.addNote({ pitch: 64, start: 1, duration: 1, velocity: 100 });
    clip.addNote({ pitch: 67, start: 2, duration: 1, velocity: 100 });
  }

  private zoom(factor: number): void {
    const viewport = this.timeline.getViewportInfo();
    const newBeatsPerPixel = viewport.beatsPerPixel * factor;
    this.timeline.setZoom(newBeatsPerPixel);

    // Update tracks
    this.trackElements.forEach(trackEl => {
      trackEl.updateViewport(viewport.start, newBeatsPerPixel);
    });
  }
}

customElements.define('csd-arrangement-view', CsdArrangementView);
