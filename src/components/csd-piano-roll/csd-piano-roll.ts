import { CanvasController } from '../../canvas/CanvasController';
import { Drum } from '../../midi/Drum';
import { midiToNote } from '../../midi/midi-to-frequency';
import { Transport } from '../../audio/Transport';
import { TrackManager, INote } from '../../audio/TrackManager';
import { AudioEngine } from '../../audio/AudioEngine';
import styles from './csd-piano-roll.scss?inline';

export class CsdPianoRoll extends HTMLElement {
  private canvasController: CanvasController;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private transport: Transport;
  private trackManager: TrackManager;
  private audioEngine: AudioEngine;

  // Piano roll properties
  private gridWidth = 16; // 16 beats (adjustable with zoom)
  private noteHeight = 20;
  private beatWidth = 40;
  private pianoKeyWidth = 80;
  private startNote = 48; // C3
  private endNote = 72; // C5
  private currentBeat = 0;
  private playedNotes: Map<string, Drum> = new Map();

  // Zoom levels
  private horizontalZoom = 1; // 1x = 40px per beat
  private verticalZoom = 1; // 1x = 20px per note

  // Interaction state
  private isDragging = false;
  private dragStartBeat: number | null = null;
  private dragStartNote: number | null = null;
  private hoveredNote: INote | null = null;

  constructor() {
    super();

    this.transport = Transport.getInstance();
    this.trackManager = TrackManager.getInstance();
    this.audioEngine = AudioEngine.getInstance();
    this.canvasController = new CanvasController();
    this.canvas = this.canvasController.getCanvasElement();
    this.ctx = this.canvasController.getCtx();

    // Setup shadow DOM
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);

    // Create container
    const container = document.createElement('div');
    container.className = 'csd-piano-roll';

    // Create controls
    const controls = this.createControls();

    // Canvas wrapper
    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'canvas-wrapper';
    canvasWrapper.appendChild(this.canvas);

    container.append(controls, canvasWrapper);
    shadowRoot.appendChild(container);

    // Setup event listeners
    this.setupEventListeners();

    // Subscribe to track changes
    this.trackManager.on('trackSelected', this.handleTrackSelected.bind(this));
    this.trackManager.on('notesChanged', this.handleNotesChanged.bind(this));
  }

  connectedCallback(): void {
    this.resizeCanvas();
    this.canvasController.draw(0, this.draw.bind(this));

    // Subscribe to transport for playback
    this.transport.onTick(this.handleTransportTick.bind(this));
    this.transport.onStateChange(this.handleTransportStateChange.bind(this));

  }
  
  private createControls(): HTMLElement {
    const controls = document.createElement('div');
    controls.className = 'controls';

    // Clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.title = 'Clear all notes in this track';
    clearButton.addEventListener('click', () => {
      const track = this.trackManager.getSelectedTrack();
      if (track && confirm('Clear all notes?')) {
        this.trackManager.clearNotes(track.id);
      }
    });

    // Horizontal zoom controls
    const hZoomLabel = document.createElement('span');
    hZoomLabel.textContent = 'H-Zoom:';
    hZoomLabel.className = 'zoom-label';

    const hZoomOut = document.createElement('button');
    hZoomOut.textContent = '−';
    hZoomOut.title = 'Zoom out horizontally';
    hZoomOut.addEventListener('click', () => this.adjustHorizontalZoom(-0.25));

    const hZoomIn = document.createElement('button');
    hZoomIn.textContent = '+';
    hZoomIn.title = 'Zoom in horizontally';
    hZoomIn.addEventListener('click', () => this.adjustHorizontalZoom(0.25));

    // Vertical zoom controls
    const vZoomLabel = document.createElement('span');
    vZoomLabel.textContent = 'V-Zoom:';
    vZoomLabel.className = 'zoom-label';

    const vZoomOut = document.createElement('button');
    vZoomOut.textContent = '−';
    vZoomOut.title = 'Zoom out vertically';
    vZoomOut.addEventListener('click', () => this.adjustVerticalZoom(-0.25));

    const vZoomIn = document.createElement('button');
    vZoomIn.textContent = '+';
    vZoomIn.title = 'Zoom in vertically';
    vZoomIn.addEventListener('click', () => this.adjustVerticalZoom(0.25));

    controls.append(
      clearButton,
      hZoomLabel, hZoomOut, hZoomIn,
      vZoomLabel, vZoomOut, vZoomIn
    );
    return controls;
  }

  private adjustHorizontalZoom(delta: number): void {
    this.horizontalZoom = Math.max(0.5, Math.min(3, this.horizontalZoom + delta));
    this.beatWidth = 40 * this.horizontalZoom;
    this.resizeCanvas();
  }

  private adjustVerticalZoom(delta: number): void {
    this.verticalZoom = Math.max(0.5, Math.min(2, this.verticalZoom + delta));
    this.noteHeight = 20 * this.verticalZoom;
    this.resizeCanvas();
  }
  
  private resizeCanvas(): void {
    const totalWidth = this.pianoKeyWidth + (this.gridWidth * this.beatWidth);
    const totalHeight = (this.endNote - this.startNote) * this.noteHeight;
    
    this.canvas.width = totalWidth;
    this.canvas.height = totalHeight;
  }
  
  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  private handleMouseDown(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x < this.pianoKeyWidth) return;

    const beat = Math.floor((x - this.pianoKeyWidth) / this.beatWidth);
    const noteIndex = Math.floor(y / this.noteHeight);
    const midiNote = this.endNote - noteIndex - 1;

    const track = this.trackManager.getSelectedTrack();
    if (!track) return;

    if (event.button === 2) { // Right click to remove
      this.removeNoteAt(track.id, midiNote, beat);
    } else { // Left click to add/start drag
      const existingNote = this.getNoteAt(track.notes, midiNote, beat);
      if (existingNote) {
        this.trackManager.removeNote(track.id, existingNote.id);
      } else {
        this.isDragging = true;
        this.dragStartBeat = beat;
        this.dragStartNote = midiNote;
      }
    }
  }
  
  private handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x < this.pianoKeyWidth) {
      this.hoveredNote = null;
      return;
    }

    const beat = Math.floor((x - this.pianoKeyWidth) / this.beatWidth);
    const noteIndex = Math.floor(y / this.noteHeight);
    const midiNote = this.endNote - noteIndex - 1;

    const track = this.trackManager.getSelectedTrack();
    if (!track) return;

    // Find hovered note
    this.hoveredNote = this.getNoteAt(track.notes, midiNote, beat);
  }
  
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isDragging || this.dragStartBeat === null || this.dragStartNote === null) {
      this.isDragging = false;
      return;
    }

    const track = this.trackManager.getSelectedTrack();
    if (!track) {
      this.isDragging = false;
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const endBeat = Math.floor((x - this.pianoKeyWidth) / this.beatWidth);

    const startBeat = Math.min(this.dragStartBeat, endBeat);
    const duration = Math.abs(endBeat - this.dragStartBeat) + 1;

    if (duration > 0) {
      this.trackManager.addNote(track.id, {
        pitch: this.dragStartNote,
        start: startBeat,
        duration,
        velocity: 100
      });
    }

    this.isDragging = false;
    this.dragStartBeat = null;
    this.dragStartNote = null;
  }
  
  private draw(): void {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawPianoKeys(ctx);
    this.drawGrid(ctx);
    this.drawNotes(ctx);
    this.drawPlayhead(ctx);
    this.drawDragPreview(ctx);
  }
  
  private drawPianoKeys(ctx: CanvasRenderingContext2D): void {
    const whiteKeyColor = getComputedStyle(document.documentElement).getPropertyValue('--color-piano-white-key').trim();
    const blackKeyColor = getComputedStyle(document.documentElement).getPropertyValue('--color-piano-black-key').trim();
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--color-piano-key-text').trim();
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--color-border-strong').trim();

    for (let i = this.startNote; i < this.endNote; i++) {
      const y = (this.endNote - i - 1) * this.noteHeight;
      const isBlackKey = [1, 3, 6, 8, 10].includes(i % 12);

      ctx.fillStyle = isBlackKey ? blackKeyColor : whiteKeyColor;
      ctx.fillRect(0, y, this.pianoKeyWidth, this.noteHeight);

      ctx.strokeStyle = borderColor;
      ctx.strokeRect(0, y, this.pianoKeyWidth, this.noteHeight);

      ctx.fillStyle = isBlackKey ? whiteKeyColor : textColor;
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(midiToNote(i), 5, y + this.noteHeight / 2);
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const gridBeatColor = getComputedStyle(document.documentElement).getPropertyValue('--color-piano-grid-beat').trim();
    const gridBarColor = getComputedStyle(document.documentElement).getPropertyValue('--color-piano-grid-bar').trim();

    for (let beat = 0; beat <= this.gridWidth; beat++) {
      const x = this.pianoKeyWidth + beat * this.beatWidth;
      ctx.strokeStyle = beat % 4 === 0 ? gridBarColor : gridBeatColor;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }

    for (let i = this.startNote; i <= this.endNote; i++) {
      const y = (this.endNote - i) * this.noteHeight;
      ctx.strokeStyle = gridBeatColor;
      ctx.beginPath();
      ctx.moveTo(this.pianoKeyWidth, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  private drawNotes(ctx: CanvasRenderingContext2D): void {
    const track = this.trackManager.getSelectedTrack();
    if (!track) return;

    track.notes.forEach(note => {
      const x = this.pianoKeyWidth + note.start * this.beatWidth;
      const y = (this.endNote - note.pitch - 1) * this.noteHeight;
      const width = note.duration * this.beatWidth;

      const isHovered = note === this.hoveredNote;
      const baseColor = track.color;

      ctx.fillStyle = isHovered ? this.lightenColor(baseColor, 20) : baseColor;
      ctx.fillRect(x + 2, y + 2, width - 4, this.noteHeight - 4);

      ctx.strokeStyle = this.lightenColor(baseColor, 40);
      ctx.strokeRect(x + 2, y + 2, width - 4, this.noteHeight - 4);
    });
  }

  private lightenColor(color: string, percent: number): string {
    // Simple color lightener for hex colors
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }

  private drawPlayhead(ctx: CanvasRenderingContext2D): void {
    if (!this.transport.isPlaying()) return;

    const playheadColor = getComputedStyle(document.documentElement).getPropertyValue('--color-danger').trim();
    const x = this.pianoKeyWidth + (this.currentBeat % this.gridWidth) * this.beatWidth;
    ctx.strokeStyle = playheadColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, this.canvas.height);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  private drawDragPreview(ctx: CanvasRenderingContext2D): void {
    if (!this.isDragging || this.dragStartBeat === null || this.dragStartNote === null) return;

    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-canvas-element').trim();
    const x = this.pianoKeyWidth + this.dragStartBeat * this.beatWidth;
    const y = (this.endNote - this.dragStartNote - 1) * this.noteHeight;

    // Convert hex to rgba with 0.3 opacity
    const rgb = parseInt(accentColor.replace('#', ''), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
    ctx.fillRect(x + 2, y + 2, this.beatWidth - 4, this.noteHeight - 4);
  }
  
  private getNoteAt(notes: INote[], midiNote: number, beat: number): INote | null {
    return notes.find(note =>
      note.pitch === midiNote &&
      beat >= note.start &&
      beat < note.start + note.duration
    ) || null;
  }

  private removeNoteAt(trackId: string, midiNote: number, beat: number): void {
    const notes = this.trackManager.getNotes(trackId);
    const note = this.getNoteAt(notes, midiNote, beat);
    if (note) {
      this.trackManager.removeNote(trackId, note.id);
    }
  }

  private handleTransportTick(tick: number): void {
    this.currentBeat = tick;

    const currentBeatInLoop = tick % this.gridWidth;
    const allTracks = this.trackManager.getAllTracks();

    // Play ALL tracks simultaneously for true multi-track playback
    allTracks.forEach(track => {
      // Skip muted tracks
      if (track.muted) return;

      // Check for any solo tracks - if any track is soloed, only play soloed tracks
      const anySolo = allTracks.some(t => t.soloed);
      if (anySolo && !track.soloed) return;

      // Stop notes that should end
      track.notes.forEach(note => {
        const noteEnd = note.start + note.duration;
        if (noteEnd === currentBeatInLoop) {
          this.audioEngine.noteOffWithTrack(track.id, note.pitch);
          const key = `${track.id}-${note.id}`;
          this.playedNotes.delete(key);
        }
      });

      // Start notes that should play
      track.notes.forEach(note => {
        if (note.start === currentBeatInLoop) {
          // Play note with this track's patch
          this.audioEngine.noteOnWithTrack(track.id, note.pitch, note.velocity);
          const key = `${track.id}-${note.id}`;
          const placeholder = new Drum(0, 'sine', 0, 0);
          this.playedNotes.set(key, placeholder);
        }
      });
    });
  }

  private handleTransportStateChange(isRunning: boolean): void {
    if (!isRunning) {
      // Stop all notes when transport stops
      this.audioEngine.stopAllNotes();
      this.playedNotes.clear();
    }
  }

  private handleTrackSelected(): void {
    // Currently no additional UI adjustments on track selection.
  }

  private handleNotesChanged(): void {
    // Notes changed, just trigger a redraw
    // The draw method will read the latest notes from the track
  }
}

customElements.define('csd-piano-roll', CsdPianoRoll);
