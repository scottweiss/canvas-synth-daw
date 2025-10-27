import Split from 'split.js';
import styles from './csd-daw-shell.scss?inline';
import '../csd-transport-bar/csd-transport-bar';
import '../csd-track-list/csd-track-list';
import '../csd-arrangement-view/csd-arrangement-view';
import '../csd-session-view/csd-session-view';
import '../csd-device-chain/csd-device-chain';
import '../csd-piano/csd-piano';
import '../csd-mixer/csd-mixer';
import type { ViewMode } from '../csd-view-toggle/csd-view-toggle';
import { Transport } from '../../audio/Transport';
import { ArrangementPlayer } from '../../audio/ArrangementPlayer';

export class CsdDawShell extends HTMLElement {
  private shadowRoot: ShadowRoot;
  private horizontalSplit: Split.Instance | null = null;
  private verticalSplit: Split.Instance | null = null;
  private currentView: ViewMode = 'arrangement';
  private arrangementView: HTMLElement | null = null;
  private sessionView: HTMLElement | null = null;
  private viewChangeHandler: (e: Event) => void;
  private transport: Transport;
  private arrangementPlayer: ArrangementPlayer;

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: 'open' });

    // Initialize audio systems
    this.transport = Transport.getInstance();
    this.arrangementPlayer = ArrangementPlayer.getInstance();

    // Bind event handler
    this.viewChangeHandler = ((e: CustomEvent) => {
      this.handleViewChange(e.detail.view);
    }) as EventListener;

    this.render();
  }

  connectedCallback(): void {
    // Initialize Split.js after DOM is ready
    requestAnimationFrame(() => {
      this.initializeSplits();
    });

    // Initialize arrangement player for default view
    this.transport.setMode('arrangement');
    this.arrangementPlayer.start();

    // Listen for view changes from the transport bar
    // Use window-level listener since event crosses shadow DOM boundaries
    window.addEventListener('viewChange', this.viewChangeHandler);
  }

  disconnectedCallback(): void {
    // Clean up Split instances
    if (this.horizontalSplit) {
      this.horizontalSplit.destroy();
    }
    if (this.verticalSplit) {
      this.verticalSplit.destroy();
    }

    // Clean up event listener
    window.removeEventListener('viewChange', this.viewChangeHandler);
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = styles;

    const container = document.createElement('div');
    container.className = 'daw-shell';

    // Transport bar (fixed at top)
    const transportBar = document.createElement('csd-transport-bar');
    transportBar.className = 'transport-section';

    // Main content area (resizable horizontal split)
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    // Left sidebar (track list + browser)
    const leftSidebar = document.createElement('div');
    leftSidebar.className = 'left-sidebar split-panel';
    leftSidebar.id = 'left-sidebar';

    const trackList = document.createElement('csd-track-list');
    leftSidebar.appendChild(trackList);

    // Center stage (piano roll / session view)
    const centerStage = document.createElement('div');
    centerStage.className = 'center-stage split-panel';
    centerStage.id = 'center-stage';

    // Create both views
    this.arrangementView = document.createElement('csd-arrangement-view');
    this.arrangementView.className = 'view-content active';

    this.sessionView = document.createElement('csd-session-view');
    this.sessionView.className = 'view-content';

    centerStage.appendChild(this.arrangementView);
    centerStage.appendChild(this.sessionView);

    // Right sidebar (device chain / synth controls)
    const rightSidebar = document.createElement('div');
    rightSidebar.className = 'right-sidebar split-panel';
    rightSidebar.id = 'right-sidebar';

    const deviceChain = document.createElement('csd-device-chain');
    rightSidebar.appendChild(deviceChain);

    // Assemble horizontal split
    mainContent.appendChild(leftSidebar);
    mainContent.appendChild(centerStage);
    mainContent.appendChild(rightSidebar);

    // Piano keyboard section (middle)
    const pianoSection = document.createElement('div');
    pianoSection.className = 'piano-section split-panel-vertical';
    pianoSection.id = 'piano-section';

    const piano = document.createElement('csd-piano');
    pianoSection.appendChild(piano);

    // Bottom section (mixer - will be part of vertical split)
    const bottomSection = document.createElement('div');
    bottomSection.className = 'bottom-section split-panel-vertical';
    bottomSection.id = 'bottom-section';

    const mixer = document.createElement('csd-mixer');
    bottomSection.appendChild(mixer);

    // Wrapper for vertical split (main content + piano + mixer)
    const verticalContainer = document.createElement('div');
    verticalContainer.className = 'vertical-container';

    const topPanel = document.createElement('div');
    topPanel.className = 'top-panel split-panel-vertical';
    topPanel.id = 'top-panel';
    topPanel.appendChild(mainContent);

    verticalContainer.appendChild(topPanel);
    verticalContainer.appendChild(pianoSection);
    verticalContainer.appendChild(bottomSection);

    // Assemble everything
    container.appendChild(transportBar);
    container.appendChild(verticalContainer);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
  }

  private initializeSplits(): void {
    const leftSidebar = this.shadowRoot.getElementById('left-sidebar');
    const centerStage = this.shadowRoot.getElementById('center-stage');
    const rightSidebar = this.shadowRoot.getElementById('right-sidebar');
    const topPanel = this.shadowRoot.getElementById('top-panel');
    const pianoSection = this.shadowRoot.getElementById('piano-section');
    const bottomSection = this.shadowRoot.getElementById('bottom-section');

    if (leftSidebar && centerStage && rightSidebar) {
      // Horizontal split (left | center | right)
      this.horizontalSplit = Split([leftSidebar, centerStage, rightSidebar], {
        sizes: [15, 60, 25], // Initial sizes in percentages
        minSize: [200, 400, 250], // Minimum sizes in pixels
        gutterSize: 8,
        cursor: 'col-resize',
        direction: 'horizontal',
        elementStyle: (dimension, size, gutterSize) => ({
          'flex-basis': `calc(${size}% - ${gutterSize}px)`,
        }),
        gutterStyle: (dimension, gutterSize) => ({
          'flex-basis': `${gutterSize}px`,
        }),
      });
    }

    if (topPanel && pianoSection && bottomSection) {
      // Vertical split (main content / piano / mixer)
      this.verticalSplit = Split([topPanel, pianoSection, bottomSection], {
        sizes: [65, 15, 20], // Initial sizes in percentages
        minSize: [300, 100, 100], // Minimum sizes in pixels
        gutterSize: 8,
        cursor: 'row-resize',
        direction: 'vertical',
        elementStyle: (dimension, size, gutterSize) => ({
          'flex-basis': `calc(${size}% - ${gutterSize}px)`,
        }),
        gutterStyle: (dimension, gutterSize) => ({
          'flex-basis': `${gutterSize}px`,
        }),
      });
    }
  }

  private handleViewChange(view: ViewMode): void {
    console.log('View change requested:', view);
    this.currentView = view;

    if (view === 'arrangement' && this.arrangementView && this.sessionView) {
      console.log('Switching to Arrangement view');
      this.arrangementView.classList.add('active');
      this.sessionView.classList.remove('active');

      // Switch transport to arrangement mode
      this.transport.setMode('arrangement');
      this.arrangementPlayer.start();
    } else if (view === 'session' && this.arrangementView && this.sessionView) {
      console.log('Switching to Session view');
      this.arrangementView.classList.remove('active');
      this.sessionView.classList.add('active');

      // Switch transport to session mode
      this.transport.setMode('session');
      this.arrangementPlayer.stop();
    }
  }
}

customElements.define('csd-daw-shell', CsdDawShell);
