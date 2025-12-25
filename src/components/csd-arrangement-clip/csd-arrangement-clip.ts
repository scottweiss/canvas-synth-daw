import { ArrangementClip } from '../../audio/ArrangementClip';
import styles from './csd-arrangement-clip.scss?inline';

export class CsdArrangementClipElement extends HTMLElement {
  private shadowRootRef: ShadowRoot;
  private clip: ArrangementClip;
  private beatsPerPixel: number = 0.1;
  private viewportStart: number = 0;
  private container: HTMLDivElement;
  private resizeHandle: HTMLDivElement;
  private isDragging: boolean = false;
  private isResizing: boolean = false;
  private dragStartX: number = 0;
  private dragStartTime: number = 0;

  constructor(clip: ArrangementClip) {
    super();
    this.shadowRootRef = this.attachShadow({ mode: 'open' });
    this.clip = clip;
    this.container = document.createElement('div');
    this.resizeHandle = document.createElement('div');
    this.render();
    this.setupEventListeners();
  }

  connectedCallback(): void {
    this.updatePosition();

    // Listen for clip changes
    this.clip.on('changed', () => {
      this.updatePosition();
      this.updateContent();
    });
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = styles;

    this.container.className = 'arrangement-clip';
    this.container.style.background = this.clip.getColor();

    // Clip name
    const name = document.createElement('div');
    name.className = 'clip-name';
    name.textContent = this.clip.getName();

    // Note visualization (simplified)
    const notes = document.createElement('div');
    notes.className = 'clip-notes';
    this.renderNotes(notes);

    // Resize handle
    this.resizeHandle.className = 'resize-handle';

    this.container.appendChild(name);
    this.container.appendChild(notes);
    this.container.appendChild(this.resizeHandle);

    this.shadowRootRef.appendChild(style);
    this.shadowRootRef.appendChild(this.container);
  }

  private renderNotes(container: HTMLDivElement): void {
    const notes = this.clip.getNotes();
    const clipLength = this.clip.getLength();

    notes.forEach(note => {
      const noteEl = document.createElement('div');
      noteEl.className = 'note';

      // Position as percentage of clip length
      const left = (note.start / clipLength) * 100;
      const width = (note.duration / clipLength) * 100;

      noteEl.style.left = `${left}%`;
      noteEl.style.width = `${width}%`;
      noteEl.style.bottom = `${(note.pitch / 127) * 100}%`;

      container.appendChild(noteEl);
    });
  }

  private setupEventListeners(): void {
    // Drag to move clip
    this.container.addEventListener('mousedown', (e) => {
      if (e.target === this.resizeHandle) {
        return; // Let resize handle its own events
      }

      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartTime = this.clip.getStartTime();
      this.container.classList.add('dragging');
      e.stopPropagation();
    });

    // Resize clip
    this.resizeHandle.addEventListener('mousedown', (e) => {
      this.isResizing = true;
      this.dragStartX = e.clientX;
      this.dragStartTime = this.clip.getEndTime();
      e.stopPropagation();
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.dragStartX;
        const deltaBeat = deltaX * this.beatsPerPixel;
        const newStartTime = Math.max(0, this.dragStartTime + deltaBeat);

        // Snap to beats
        const snappedTime = Math.round(newStartTime);
        this.clip.setStartTime(snappedTime);

        this.dispatchEvent(new CustomEvent('clipMoved', {
          bubbles: true,
          detail: { clip: this.clip }
        }));
      } else if (this.isResizing) {
        const deltaX = e.clientX - this.dragStartX;
        const deltaBeat = deltaX * this.beatsPerPixel;
        const newEndTime = Math.max(
          this.clip.getStartTime() + 1,
          this.dragStartTime + deltaBeat
        );

        // Snap to beats
        const snappedTime = Math.round(newEndTime);
        this.clip.setEndTime(snappedTime);

        this.dispatchEvent(new CustomEvent('clipResized', {
          bubbles: true,
          detail: { clip: this.clip }
        }));
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging || this.isResizing) {
        this.isDragging = false;
        this.isResizing = false;
        this.container.classList.remove('dragging');
      }
    });

    // Double-click to edit
    this.container.addEventListener('dblclick', () => {
      this.dispatchEvent(new CustomEvent('clipEdit', {
        bubbles: true,
        detail: { clip: this.clip }
      }));
    });

    // Right-click for context menu
    this.container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.dispatchEvent(new CustomEvent('clipContext', {
        bubbles: true,
        detail: { clip: this.clip, x: e.clientX, y: e.clientY }
      }));
    });
  }

  public updateViewport(viewportStart: number, beatsPerPixel: number): void {
    this.viewportStart = viewportStart;
    this.beatsPerPixel = beatsPerPixel;
    this.updatePosition();
  }

  private updatePosition(): void {
    const startTime = this.clip.getStartTime();
    const endTime = this.clip.getEndTime();
    const left = (startTime - this.viewportStart) / this.beatsPerPixel;
    const width = (endTime - startTime) / this.beatsPerPixel;

    this.container.style.left = `${left}px`;
    this.container.style.width = `${width}px`;
  }

  private updateContent(): void {
    // Update name
    const nameEl = this.shadowRootRef.querySelector('.clip-name') as HTMLDivElement;
    if (nameEl) {
      nameEl.textContent = this.clip.getName();
    }

    // Update color
    this.container.style.background = this.clip.getColor();

    // Re-render notes
    const notesContainer = this.shadowRootRef.querySelector('.clip-notes') as HTMLDivElement;
    if (notesContainer) {
      notesContainer.innerHTML = '';
      this.renderNotes(notesContainer);
    }
  }

  public getClip(): ArrangementClip {
    return this.clip;
  }
}

customElements.define('csd-arrangement-clip', CsdArrangementClipElement);
