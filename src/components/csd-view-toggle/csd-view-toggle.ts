import styles from './csd-view-toggle.scss?inline';

export type ViewMode = 'piano-roll' | 'session' | 'arrangement';

export class CsdViewToggle extends HTMLElement {
  private shadowRootRef: ShadowRoot;
  private currentView: ViewMode = 'piano-roll';

  constructor() {
    super();
    this.shadowRootRef = this.attachShadow({ mode: 'open' });
    this.render();
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = styles;

    const container = document.createElement('div');
    container.className = 'view-toggle';

    const pianoRollButton = document.createElement('button');
    pianoRollButton.className = 'view-button active';
    pianoRollButton.textContent = 'Piano Roll';
    pianoRollButton.dataset.view = 'piano-roll';

    const sessionButton = document.createElement('button');
    sessionButton.className = 'view-button';
    sessionButton.textContent = 'Session';
    sessionButton.dataset.view = 'session';

    const arrangementButton = document.createElement('button');
    arrangementButton.className = 'view-button';
    arrangementButton.textContent = 'Arrangement';
    arrangementButton.dataset.view = 'arrangement';

    pianoRollButton.addEventListener('click', () => this.setView('piano-roll'));
    sessionButton.addEventListener('click', () => this.setView('session'));
    arrangementButton.addEventListener('click', () => this.setView('arrangement'));

    container.appendChild(pianoRollButton);
    container.appendChild(sessionButton);
    container.appendChild(arrangementButton);

    this.shadowRootRef.appendChild(style);
    this.shadowRootRef.appendChild(container);
  }

  private setView(view: ViewMode): void {
    if (this.currentView === view) {
      return;
    }

    this.currentView = view;

    // Update button states
    const buttons = this.shadowRootRef.querySelectorAll('.view-button');
    buttons.forEach((button) => {
      const buttonView = (button as HTMLElement).dataset.view;
      if (buttonView === view) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });

    // Dispatch custom event
    this.dispatchEvent(
      new CustomEvent('viewChange', {
        bubbles: true,
        composed: true, // Allow event to cross shadow DOM boundaries
        detail: { view },
      })
    );
  }

  public getView(): ViewMode {
    return this.currentView;
  }
}

customElements.define('csd-view-toggle', CsdViewToggle);
