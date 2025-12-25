import { Clip, ClipState } from '../../audio/Clip';
import styles from './csd-clip-slot.scss?inline';

export interface ICsdClipSlotProps {
  trackId: string;
  sceneIndex: number;
  clip?: Clip;
}

export class CsdClipSlot extends HTMLElement {
  private shadowRootRef: ShadowRoot;
  private trackId: string;
  private sceneIndex: number;
  private clip: Clip | null = null;
  private container: HTMLElement;

  constructor(props: ICsdClipSlotProps) {
    super();
    this.shadowRootRef = this.attachShadow({ mode: 'open' });
    this.trackId = props.trackId;
    this.sceneIndex = props.sceneIndex;
    this.clip = props.clip || null;

    this.container = document.createElement('div');
    this.render();
  }

  connectedCallback(): void {
    // Listen for clip changes
    if (this.clip) {
      this.clip.on('stateChanged', this.handleStateChange.bind(this));
      this.clip.on('changed', this.updateDisplay.bind(this));
    }
  }

  disconnectedCallback(): void {
    // Clean up listeners
    if (this.clip) {
      this.clip.removeAllListeners();
    }
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = styles;

    this.container.className = 'clip-slot';
    this.updateDisplay();

    // Click handler
    this.container.addEventListener('click', (e) => {
      if (e.shiftKey) {
        // Shift+click = stop clip
        this.handleStop();
      } else if (e.altKey) {
        // Alt+click = delete clip
        this.handleDelete();
      } else {
        // Regular click = play/record
        this.handleClick();
      }
    });

    // Double-click handler
    this.container.addEventListener('dblclick', () => {
      this.handleDoubleClick();
    });

    // Right-click context menu
    this.container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.handleContextMenu();
    });

    this.shadowRootRef.appendChild(style);
    this.shadowRootRef.appendChild(this.container);
  }

  private updateDisplay(): void {
    if (!this.clip || this.clip.isEmpty()) {
      this.container.className = 'clip-slot empty';
      this.container.innerHTML = '<div class="clip-content"><div class="empty-hint">Click to record</div></div>';
      return;
    }

    const state = this.clip.getState();
    this.container.className = `clip-slot ${state}`;
    this.container.style.setProperty('--clip-color', this.clip.getColor());

    const content = document.createElement('div');
    content.className = 'clip-content';

    const name = document.createElement('div');
    name.className = 'clip-name';
    name.textContent = this.clip.getName();

    const indicator = document.createElement('div');
    indicator.className = 'clip-indicator';
    indicator.textContent = this.getStateIndicator(state);

    content.appendChild(name);
    content.appendChild(indicator);

    this.container.innerHTML = '';
    this.container.appendChild(content);
  }

  private getStateIndicator(state: ClipState): string {
    switch (state) {
      case 'recording':
        return '●';
      case 'playing':
        return '▶';
      case 'stopped':
        return '■';
      case 'queued':
        return '⏵';
      default:
        return '';
    }
  }

  private handleClick(): void {
    if (!this.clip || this.clip.isEmpty()) {
      // Create new clip and start recording
      this.dispatchEvent(
        new CustomEvent('clipRecord', {
          bubbles: true,
          composed: true,
          detail: { trackId: this.trackId, sceneIndex: this.sceneIndex },
        })
      );
    } else {
      // Toggle playback
      const state = this.clip.getState();
      if (state === 'playing') {
        this.clip.stop();
      } else {
        this.clip.start();
      }
      this.updateDisplay();

      this.dispatchEvent(
        new CustomEvent('clipToggle', {
          bubbles: true,
          composed: true,
          detail: {
            trackId: this.trackId,
            sceneIndex: this.sceneIndex,
            clip: this.clip,
          },
        })
      );
    }
  }

  private handleDoubleClick(): void {
    if (this.clip && !this.clip.isEmpty()) {
      // Double-click opens clip in arrangement view (to be implemented)
      this.dispatchEvent(
        new CustomEvent('clipOpen', {
          bubbles: true,
          composed: true,
          detail: { trackId: this.trackId, sceneIndex: this.sceneIndex, clip: this.clip },
        })
      );
    }
  }

  private handleStop(): void {
    if (this.clip) {
      this.clip.stop();
      this.updateDisplay();
    }
  }

  private handleDelete(): void {
    if (this.clip) {
      this.dispatchEvent(
        new CustomEvent('clipDelete', {
          bubbles: true,
          composed: true,
          detail: { trackId: this.trackId, sceneIndex: this.sceneIndex },
        })
      );
    }
  }

  private handleContextMenu(): void {
    // Context menu for clip options
    this.dispatchEvent(
      new CustomEvent('clipContextMenu', {
        bubbles: true,
        composed: true,
        detail: {
          trackId: this.trackId,
          sceneIndex: this.sceneIndex,
          clip: this.clip,
        },
      })
    );
  }

  private handleStateChange(): void {
    this.updateDisplay();
  }

  // Public methods for updating the clip
  public setClip(clip: Clip | null): void {
    // Remove old listeners
    if (this.clip) {
      this.clip.removeAllListeners();
    }

    this.clip = clip;

    // Add new listeners
    if (this.clip) {
      this.clip.on('stateChanged', this.handleStateChange.bind(this));
      this.clip.on('changed', this.updateDisplay.bind(this));
    }

    this.updateDisplay();
  }

  public getClip(): Clip | null {
    return this.clip;
  }
}

customElements.define('csd-clip-slot', CsdClipSlot);
