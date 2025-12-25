import { TrackManager, ITrack } from '../../audio/TrackManager';
import styles from './csd-track-list.scss?inline';

export class CsdTrackList extends HTMLElement {
  private trackManager: TrackManager;
  private shadowRootRef: ShadowRoot;
  private trackListContainer: HTMLDivElement;

  constructor() {
    super();
    this.shadowRootRef = this.attachShadow({ mode: 'open' });
    this.trackManager = TrackManager.getInstance();
    this.trackListContainer = document.createElement('div');

    this.render();
    this.attachEventListeners();
  }

  connectedCallback(): void {
    // Subscribe to track manager events
    this.trackManager.on('tracksChanged', this.handleTracksChanged.bind(this));
    this.trackManager.on('trackSelected', this.handleTrackSelected.bind(this));
    this.trackManager.on('trackUpdated', this.handleTrackUpdated.bind(this));

    // Initial render
    this.renderTracks();
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = styles;

    const container = document.createElement('div');
    container.className = 'track-list';

    // Header
    const header = document.createElement('div');
    header.className = 'track-list-header';

    const title = document.createElement('h3');
    title.textContent = 'Tracks';
    title.className = 'track-list-title';

    const addButton = document.createElement('button');
    addButton.className = 'add-track-button';
    addButton.innerHTML = '+';
    addButton.title = 'Add Track';
    addButton.addEventListener('click', () => {
      const trackCount = this.trackManager.getAllTracks().length + 1;
      this.trackManager.createTrack(`Track ${trackCount}`);
    });

    header.appendChild(title);
    header.appendChild(addButton);

    // Track list container
    this.trackListContainer.className = 'tracks-container';

    container.appendChild(header);
    container.appendChild(this.trackListContainer);

    this.shadowRootRef.appendChild(style);
    this.shadowRootRef.appendChild(container);
  }

  private attachEventListeners(): void {
    // Event listeners will be attached to individual track elements
  }

  private renderTracks(): void {
    const tracks = this.trackManager.getAllTracks();
    const selectedTrack = this.trackManager.getSelectedTrack();

    this.trackListContainer.innerHTML = '';

    tracks.forEach(track => {
      const trackRow = this.createTrackRow(track, track.id === selectedTrack?.id);
      this.trackListContainer.appendChild(trackRow);
    });
  }

  private createTrackRow(track: ITrack, isSelected: boolean): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'track-row';
    row.dataset.trackId = track.id;

    if (isSelected) {
      row.classList.add('selected');
    }

    // Color indicator
    const colorIndicator = document.createElement('div');
    colorIndicator.className = 'track-color';
    colorIndicator.style.backgroundColor = track.color;

    // Track name
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'track-name';
    nameInput.value = track.name;
    nameInput.addEventListener('change', () => {
      this.trackManager.updateTrack(track.id, { name: nameInput.value });
    });
    nameInput.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent track selection when clicking input
    });

    // Controls container
    const controls = document.createElement('div');
    controls.className = 'track-controls';

    // Arm button
    const armButton = document.createElement('button');
    armButton.className = 'track-button arm-button';
    armButton.innerHTML = '●';
    armButton.title = 'Arm for recording';
    if (track.armed) armButton.classList.add('active');
    armButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.trackManager.updateTrack(track.id, { armed: !track.armed });
    });

    // Solo button
    const soloButton = document.createElement('button');
    soloButton.className = 'track-button solo-button';
    soloButton.innerHTML = 'S';
    soloButton.title = 'Solo';
    if (track.soloed) soloButton.classList.add('active');
    soloButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.trackManager.updateTrack(track.id, { soloed: !track.soloed });
    });

    // Mute button
    const muteButton = document.createElement('button');
    muteButton.className = 'track-button mute-button';
    muteButton.innerHTML = 'M';
    muteButton.title = 'Mute';
    if (track.muted) muteButton.classList.add('active');
    muteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.trackManager.updateTrack(track.id, { muted: !track.muted });
    });

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'track-button delete-button';
    deleteButton.innerHTML = '×';
    deleteButton.title = 'Delete track';
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.trackManager.getAllTracks().length > 1) {
        if (confirm(`Delete "${track.name}"?`)) {
          this.trackManager.deleteTrack(track.id);
        }
      } else {
        alert('Cannot delete the last track');
      }
    });

    controls.appendChild(armButton);
    controls.appendChild(soloButton);
    controls.appendChild(muteButton);
    controls.appendChild(deleteButton);

    // Assemble row
    row.appendChild(colorIndicator);
    row.appendChild(nameInput);
    row.appendChild(controls);

    // Select track on click
    row.addEventListener('click', () => {
      this.trackManager.selectTrack(track.id);
    });

    return row;
  }

  private handleTracksChanged(): void {
    this.renderTracks();
  }

  private handleTrackSelected(): void {
    this.renderTracks();
  }

  private handleTrackUpdated(): void {
    this.renderTracks();
  }
}

customElements.define('csd-track-list', CsdTrackList);
