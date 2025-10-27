import styles from './csd-view-toggle.scss?inline';

export type ViewMode = 'session' | 'arrangement';

export class CsdViewToggle extends HTMLElement {
  private shadowRoot: ShadowRoot;
  private currentView: ViewMode = 'arrangement';

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: 'open' });
    this.render();
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = styles;

    const container = document.createElement('div');
    container.className = 'view-toggle';

    const sessionButton = document.createElement('button');
    sessionButton.className = 'view-button';
    sessionButton.textContent = 'Session';
    sessionButton.dataset.view = 'session';

    const arrangementButton = document.createElement('button');
    arrangementButton.className = 'view-button active';
    arrangementButton.textContent = 'Arrangement';
    arrangementButton.dataset.view = 'arrangement';

    sessionButton.addEventListener('click', () => this.setView('session'));
    arrangementButton.addEventListener('click', () => this.setView('arrangement'));

    container.appendChild(sessionButton);
    container.appendChild(arrangementButton);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
  }

  private setView(view: ViewMode): void {
    console.log('View toggle clicked:', view);
    if (this.currentView === view) {
      console.log('Already on this view, ignoring');
      return;
    }

    this.currentView = view;

    // Update button states
    const buttons = this.shadowRoot.querySelectorAll('.view-button');
    buttons.forEach((button) => {
      const buttonView = (button as HTMLElement).dataset.view;
      if (buttonView === view) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });

    // Dispatch custom event
    console.log('Dispatching viewChange event:', view);
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
