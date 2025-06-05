import { AudioEngine } from '../../audio/AudioEngine';
import { CanvasController } from '../../canvas/CanvasController';
import { Drum } from '../../midi/Drum';
import midiToFrequency, { midiToNote } from '../../midi/midi-to-frequency';
import { Timer } from '../../Timer';
import styles from './csd-piano-roll.scss?inline';

export interface PianoRollNote {
  midiNote: number;
  startBeat: number;
  duration: number;
  velocity: number;
}

export class CsdPianoRoll extends HTMLElement {
  private canvasController: CanvasController;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private audioEngine: AudioEngine;
  private timer: Timer;
  
  // Piano roll properties
  private notes: PianoRollNote[] = [];
  private gridWidth = 16; // 16 beats
  private noteHeight = 20;
  private beatWidth = 40;
  private pianoKeyWidth = 80;
  private startNote = 48; // C3
  private endNote = 72; // C5
  private currentBeat = 0;
  private isPlaying = false;
  private playedNotes: Map<string, Drum> = new Map();
  
  // Interaction state
  private isDragging = false;
  private dragStartBeat: number | null = null;
  private dragStartNote: number | null = null;
  private hoveredNote: PianoRollNote | null = null;

  constructor() {
    super();
    
    this.audioEngine = AudioEngine.getInstance();
    this.timer = new Timer();
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
    
    // Load saved notes
    this.loadNotes();
  }
  
  connectedCallback(): void {
    this.resizeCanvas();
    this.canvasController.draw(0, this.draw.bind(this));
    this.timer.beat(0, this.beatCallback.bind(this));
  }
  
  private createControls(): HTMLElement {
    const controls = document.createElement('div');
    controls.className = 'controls';
    
    const playButton = document.createElement('button');
    playButton.textContent = 'Play';
    playButton.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      playButton.textContent = this.isPlaying ? 'Stop' : 'Play';
      if (!this.isPlaying) {
        this.currentBeat = 0;
        this.stopAllNotes();
      }
    });
    
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.addEventListener('click', () => {
      this.notes = [];
      this.saveNotes();
    });
    
    controls.append(playButton, clearButton);
    return controls;
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
    
    if (event.button === 2) { // Right click to remove
      this.removeNoteAt(midiNote, beat);
    } else { // Left click to add/start drag
      const existingNote = this.getNoteAt(midiNote, beat);
      if (existingNote) {
        this.removeNote(existingNote);
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
    
    // Find hovered note
    this.hoveredNote = this.getNoteAt(midiNote, beat);
  }
  
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isDragging || this.dragStartBeat === null || this.dragStartNote === null) {
      this.isDragging = false;
      return;
    }
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const endBeat = Math.floor((x - this.pianoKeyWidth) / this.beatWidth);
    
    const startBeat = Math.min(this.dragStartBeat, endBeat);
    const duration = Math.abs(endBeat - this.dragStartBeat) + 1;
    
    if (duration > 0) {
      this.addNote({
        midiNote: this.dragStartNote,
        startBeat,
        duration,
        velocity: 100
      });
    }
    
    this.isDragging = false;
    this.dragStartBeat = null;
    this.dragStartNote = null;
  }
  
  private draw(): void {
    if (!this.ctx) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawPianoKeys();
    this.drawGrid();
    this.drawNotes();
    this.drawPlayhead();
    this.drawDragPreview();
  }
  
  private drawPianoKeys(): void {
    if (!this.ctx) return;
    
    for (let i = this.startNote; i < this.endNote; i++) {
      const y = (this.endNote - i - 1) * this.noteHeight;
      const isBlackKey = [1, 3, 6, 8, 10].includes(i % 12);
      
      // Draw key background
      this.ctx.fillStyle = isBlackKey ? '#333' : '#fff';
      this.ctx.fillRect(0, y, this.pianoKeyWidth, this.noteHeight);
      
      // Draw border
      this.ctx.strokeStyle = '#666';
      this.ctx.strokeRect(0, y, this.pianoKeyWidth, this.noteHeight);
      
      // Draw note name
      this.ctx.fillStyle = isBlackKey ? '#fff' : '#000';
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(midiToNote(i), 5, y + this.noteHeight / 2);
    }
  }
  
  private drawGrid(): void {
    if (!this.ctx) return;
    
    // Draw vertical lines (beats)
    for (let beat = 0; beat <= this.gridWidth; beat++) {
      const x = this.pianoKeyWidth + beat * this.beatWidth;
      this.ctx.strokeStyle = beat % 4 === 0 ? '#666' : '#444';
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Draw horizontal lines (notes)
    for (let i = this.startNote; i <= this.endNote; i++) {
      const y = (this.endNote - i) * this.noteHeight;
      this.ctx.strokeStyle = '#444';
      this.ctx.beginPath();
      this.ctx.moveTo(this.pianoKeyWidth, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }
  
  private drawNotes(): void {
    if (!this.ctx) return;
    
    this.notes.forEach(note => {
      const x = this.pianoKeyWidth + note.startBeat * this.beatWidth;
      const y = (this.endNote - note.midiNote - 1) * this.noteHeight;
      const width = note.duration * this.beatWidth;
      
      // Draw note rectangle
      this.ctx.fillStyle = note === this.hoveredNote ? '#4a4' : '#3a3';
      this.ctx.fillRect(x + 2, y + 2, width - 4, this.noteHeight - 4);
      
      // Draw border
      this.ctx.strokeStyle = '#1f1';
      this.ctx.strokeRect(x + 2, y + 2, width - 4, this.noteHeight - 4);
    });
  }
  
  private drawPlayhead(): void {
    if (!this.ctx || !this.isPlaying) return;
    
    const x = this.pianoKeyWidth + (this.currentBeat % this.gridWidth) * this.beatWidth;
    this.ctx.strokeStyle = '#f44';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, this.canvas.height);
    this.ctx.stroke();
    this.ctx.lineWidth = 1;
  }
  
  private drawDragPreview(): void {
    if (!this.ctx || !this.isDragging || this.dragStartBeat === null || this.dragStartNote === null) return;
    
    const x = this.pianoKeyWidth + this.dragStartBeat * this.beatWidth;
    const y = (this.endNote - this.dragStartNote - 1) * this.noteHeight;
    
    this.ctx.fillStyle = 'rgba(58, 255, 58, 0.3)';
    this.ctx.fillRect(x + 2, y + 2, this.beatWidth - 4, this.noteHeight - 4);
  }
  
  private getNoteAt(midiNote: number, beat: number): PianoRollNote | null {
    return this.notes.find(note => 
      note.midiNote === midiNote && 
      beat >= note.startBeat && 
      beat < note.startBeat + note.duration
    ) || null;
  }
  
  private addNote(note: PianoRollNote): void {
    // Remove any overlapping notes
    this.notes = this.notes.filter(existingNote => {
      if (existingNote.midiNote !== note.midiNote) return true;
      
      const noteEnd = note.startBeat + note.duration;
      const existingEnd = existingNote.startBeat + existingNote.duration;
      
      return noteEnd <= existingNote.startBeat || note.startBeat >= existingEnd;
    });
    
    this.notes.push(note);
    this.saveNotes();
  }
  
  private removeNote(note: PianoRollNote): void {
    this.notes = this.notes.filter(n => n !== note);
    this.saveNotes();
  }
  
  private removeNoteAt(midiNote: number, beat: number): void {
    const note = this.getNoteAt(midiNote, beat);
    if (note) {
      this.removeNote(note);
    }
  }
  
  private beatCallback(): void {
    if (!this.isPlaying) return;
    
    const currentBeatInLoop = this.currentBeat % this.gridWidth;
    
    // Stop notes that should end
    this.notes.forEach(note => {
      const noteEnd = note.startBeat + note.duration;
      if (noteEnd === currentBeatInLoop) {
        const key = `${note.midiNote}-${note.startBeat}`;
        this.playedNotes.delete(key);
      }
    });
    
    // Start notes that should play
    this.notes.forEach(note => {
      if (note.startBeat === currentBeatInLoop) {
        const drum = new Drum(midiToFrequency(note.midiNote), 'sawtooth', 0.01, note.duration * 0.1);
        drum.play();
        const key = `${note.midiNote}-${note.startBeat}`;
        this.playedNotes.set(key, drum);
      }
    });
    
    this.currentBeat++;
  }
  
  private stopAllNotes(): void {
    this.playedNotes.clear();
  }
  
  private saveNotes(): void {
    localStorage.setItem('csd-piano-roll-notes', JSON.stringify(this.notes));
  }
  
  private loadNotes(): void {
    const saved = localStorage.getItem('csd-piano-roll-notes');
    if (saved) {
      try {
        this.notes = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load piano roll notes:', e);
      }
    }
  }
}

customElements.define('csd-piano-roll', CsdPianoRoll);
