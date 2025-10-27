import { ITrack } from '../../audio/TrackManager';
import { ArrangementClip } from '../../audio/ArrangementClip';
import { CsdArrangementClipElement } from '../csd-arrangement-clip/csd-arrangement-clip';
import '../csd-arrangement-clip/csd-arrangement-clip';
import styles from './csd-arrangement-track.scss?inline';

export class CsdArrangementTrack extends HTMLElement {
  private shadowRoot: ShadowRoot;
  private track: ITrack;
  private beatsPerPixel: number = 0.1;
  private viewportStart: number = 0;
  private container: HTMLDivElement;
  private clipsContainer: HTMLDivElement;
  private trackHeader: HTMLDivElement;
  private clipElements: Map<string, CsdArrangementClipElement> = new Map();

  constructor(track: ITrack) {
    super();
    this.shadowRoot = this.attachShadow({ mode: 'open' });
    this.track = track;
    this.container = document.createElement('div');
    this.clipsContainer = document.createElement('div');
    this.trackHeader = document.createElement('div');
    this.render();
  }

  connectedCallback(): void {
    this.renderClips();
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = styles;

    this.container.className = 'arrangement-track';

    // Track header (name, controls)
    this.trackHeader.className = 'track-header';
    this.trackHeader.style.background = this.track.color;

    const trackName = document.createElement('div');
    trackName.className = 'track-name';
    trackName.textContent = this.track.name;

    this.trackHeader.appendChild(trackName);

    // Clips container
    this.clipsContainer.className = 'clips-container';

    // Add drop zone for creating new clips
    this.clipsContainer.addEventListener('dblclick', (e) => {
      const rect = this.clipsContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const beat = Math.floor(this.viewportStart + (x * this.beatsPerPixel));

      this.dispatchEvent(new CustomEvent('createClip', {
        bubbles: true,
        detail: { trackId: this.track.id, startTime: beat }
      }));
    });

    this.container.appendChild(this.trackHeader);
    this.container.appendChild(this.clipsContainer);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(this.container);
  }

  private renderClips(): void {
    // Clear existing clip elements
    this.clipsContainer.innerHTML = '';
    this.clipElements.clear();

    // Render each arrangement clip
    this.track.arrangementClips.forEach(clip => {
      this.addClipElement(clip);
    });
  }

  private addClipElement(clip: ArrangementClip): void {
    const clipEl = new CsdArrangementClipElement(clip);
    clipEl.updateViewport(this.viewportStart, this.beatsPerPixel);

    this.clipsContainer.appendChild(clipEl);
    this.clipElements.set(clip.getId(), clipEl);
  }

  public updateViewport(viewportStart: number, beatsPerPixel: number): void {
    this.viewportStart = viewportStart;
    this.beatsPerPixel = beatsPerPixel;

    // Update all clip elements
    this.clipElements.forEach(clipEl => {
      clipEl.updateViewport(viewportStart, beatsPerPixel);
    });
  }

  public addClip(clip: ArrangementClip): void {
    this.addClipElement(clip);
  }

  public removeClip(clipId: string): void {
    const clipEl = this.clipElements.get(clipId);
    if (clipEl) {
      this.clipsContainer.removeChild(clipEl);
      this.clipElements.delete(clipId);
    }
  }

  public getTrack(): ITrack {
    return this.track;
  }
}

customElements.define('csd-arrangement-track', CsdArrangementTrack);
