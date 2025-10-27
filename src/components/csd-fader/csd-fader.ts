import styles from './csd-fader.scss?inline';

export interface ICsdFaderProps {
  label: string;
  value?: number; // 0-1 range
  min?: number;
  max?: number;
}

export class CsdFader extends HTMLElement {
  private _value: number;
  private min: number;
  private max: number;
  private label: string;
  private faderTrack: HTMLDivElement;
  private faderThumb: HTMLDivElement;
  private valueDisplay: HTMLSpanElement;
  private isDragging: boolean = false;
  private startY: number = 0;
  private startValue: number = 0;

  get value(): number {
    return this._value;
  }

  set value(val: number) {
    this._value = Math.max(this.min, Math.min(this.max, val));
    this.updateDisplay();
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: this._value }
    }));
  }

  constructor(props: ICsdFaderProps) {
    super();

    this.label = props.label;
    this.min = props.min ?? 0;
    this.max = props.max ?? 1;
    this._value = props.value ?? 0.75;

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);

    const container = document.createElement('div');
    container.className = 'fader-container';

    const labelElement = document.createElement('label');
    labelElement.textContent = this.label;
    labelElement.className = 'fader-label';

    this.valueDisplay = document.createElement('span');
    this.valueDisplay.className = 'fader-value';

    const faderWrapper = document.createElement('div');
    faderWrapper.className = 'fader-wrapper';

    this.faderTrack = document.createElement('div');
    this.faderTrack.className = 'fader-track';

    const faderFill = document.createElement('div');
    faderFill.className = 'fader-fill';

    this.faderThumb = document.createElement('div');
    this.faderThumb.className = 'fader-thumb';

    this.faderTrack.appendChild(faderFill);
    this.faderTrack.appendChild(this.faderThumb);
    faderWrapper.appendChild(this.faderTrack);

    container.append(labelElement, faderWrapper, this.valueDisplay);
    shadowRoot.appendChild(container);

    this.setupEventListeners();
    this.updateDisplay();
  }

  private setupEventListeners(): void {
    this.faderThumb.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Click on track to jump to position
    this.faderTrack.addEventListener('click', (e) => {
      const rect = this.faderTrack.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const percentage = 1 - (y / rect.height);
      this.value = this.min + (percentage * (this.max - this.min));
    });

    // Scroll wheel support
    this.faderTrack.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.01 : 0.01;
      this.value = this._value + (delta * (this.max - this.min));
    });
  }

  private handleMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.startY = e.clientY;
    this.startValue = this._value;
    e.preventDefault();
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const rect = this.faderTrack.getBoundingClientRect();
    const deltaY = this.startY - e.clientY;
    const deltaValue = (deltaY / rect.height) * (this.max - this.min);

    this.value = this.startValue + deltaValue;
  }

  private handleMouseUp(): void {
    this.isDragging = false;
  }

  private updateDisplay(): void {
    const percentage = (this._value - this.min) / (this.max - this.min);
    const position = percentage * 100;

    this.faderThumb.style.bottom = `${position}%`;

    const fill = this.faderTrack.querySelector('.fader-fill') as HTMLDivElement;
    if (fill) {
      fill.style.height = `${position}%`;
    }

    // Display value in dB for volume faders
    if (this._value === 0) {
      this.valueDisplay.textContent = '-∞';
    } else {
      const db = 20 * Math.log10(this._value);
      this.valueDisplay.textContent = `${db.toFixed(1)} dB`;
    }
  }
}

customElements.define('csd-fader', CsdFader);
