import styles from './csd-knob.scss?inline';

export interface ICsdKnobProps {
  label: string;
  min: number;
  max: number;
  value: number;
  stepSize?: number;
  unit?: string;
}

export class CsdKnob extends HTMLElement {
  private _value: number;
  private min: number;
  private max: number;
  private unit: string;
  private label: string;
  private knobElement: HTMLDivElement;
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
  
  constructor(props: ICsdKnobProps) {
    super();
    
    this.label = props.label;
    this.min = props.min;
    this.max = props.max;
    this._value = props.value;
    this.unit = props.unit || '';
    
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);
    
    const container = document.createElement('div');
    container.className = 'knob-container';
    
    const labelElement = document.createElement('label');
    labelElement.textContent = this.label;
    
    this.knobElement = document.createElement('div');
    this.knobElement.className = 'knob';
    
    this.valueDisplay = document.createElement('span');
    this.valueDisplay.className = 'value';
    
    container.append(labelElement, this.knobElement, this.valueDisplay);
    shadowRoot.appendChild(container);
    
    this.setupEventListeners();
    this.updateDisplay();
  }
  
  private setupEventListeners(): void {
    this.knobElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    this.knobElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      const step = (this.max - this.min) / 100;
      this.value = this.value + (delta * step);
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
    
    const deltaY = this.startY - e.clientY;
    const range = this.max - this.min;
    const deltaValue = (deltaY / 100) * range;
    
    this.value = this.startValue + deltaValue;
  }
  
  private handleMouseUp(): void {
    this.isDragging = false;
  }
  
  private updateDisplay(): void {
    const percentage = (this._value - this.min) / (this.max - this.min);
    const rotation = -135 + (270 * percentage);
    
    this.knobElement.style.transform = `rotate(${rotation}deg)`;
    this.valueDisplay.textContent = `${this._value.toFixed(2)}${this.unit}`;
  }
}

customElements.define('csd-knob', CsdKnob);
