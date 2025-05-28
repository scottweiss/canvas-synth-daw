import { CanvasController } from '../../canvas/CanvasController';
import styles from './csd-range.scss?inline';

export type CsdRangeProps = {
  min?: number;
  max?: number;
  stepSize?: number;
  label: string;
  value?: number;
};

export class CsdRange extends HTMLElement {
  // rangeDomReference;
  _value: number;
  label: string;
  rangeElement: HTMLInputElement;
  outputElement: HTMLOutputElement;
  min: number;
  max: number;
  stepSize: number;
  canvasController: CanvasController;
  #canvas: HTMLCanvasElement;
  mousePositionOnMousedown: { x: number; y: number } | undefined;
  #ctx;

  constructor(props: CsdRangeProps) {
    super();

    this.canvasController = new CanvasController();

    this.#canvas = this.canvasController.getCanvasElement();
    this.#ctx = this.canvasController.getCtx();

    this._value = props.value || 0;
    this.min = props.min || 0;
    this.max = props.max || 1;
    this.stepSize = props.stepSize || 0.01;
    this.label = props.label;

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);

    const shadowRoot = this.attachShadow({ mode: 'open' });

    this.rangeElement = this.renderRangeElement();
    this.outputElement = this.renderRangeValueDisplayElement();

    const rangeLabel = document.createElement('label');
    const labelSpan = document.createElement('span');
    rangeLabel.classList.add('sr-only');
    labelSpan.classList.add('sr-only');
    labelSpan.innerText = this.label;

    rangeLabel.append(labelSpan, this.rangeElement);

    shadowRoot.adoptedStyleSheets.push(sheet);
    shadowRoot.appendChild(this.outputElement);
    shadowRoot.appendChild(this.#canvas);

    shadowRoot.appendChild(rangeLabel);

    if (props?.value != null) {
      this._value = props.value;
    }
  }

  set value(value: number) {
    this._value = value;
    this.outputElement.value = String(value);
    this.rangeElement.value = String(value);

    requestAnimationFrame(() => {
      this.dispatchEvent(
        new CustomEvent('csdRange', {
          detail: {
            value: this.value,
          },
        })
      );
    });
    this.drawCanvas();
  }

  get value(): number {
    return this._value;
  }

  renderRangeValueDisplayElement(): HTMLOutputElement {
    const rangeValueInput = document.createElement('output');
    rangeValueInput.setAttribute('type', 'text');
    rangeValueInput.value = String(this.value);

    // rangeValueInput.addEventListener('input', (event) => {
    //   this.value = (event.target as ).value;
    // });

    return rangeValueInput;
  }

  renderRangeElement(): HTMLInputElement {
    const rangeElement = document.createElement('input');
    rangeElement.setAttribute('type', 'range');
    rangeElement.setAttribute('min', String(this.min));
    rangeElement.setAttribute('max', String(this.max));
    rangeElement.setAttribute('step', String(this.stepSize));
    rangeElement.value = String(this.value);

    rangeElement.addEventListener('input', (event) => {
      this.value = Number((event.target as HTMLInputElement).value);
    });

    return rangeElement;
  }

  drawCanvas(): void {
    if (this.#ctx == null) {
      return;
    }
    // const width = this.#canvas.clientWidth;
    // const height = this.#canvas.clientHeight;

    this.#canvas.width = 100;
    this.#canvas.height = 100;

    const canvasWidth = this.#canvas.width;
    const canvasHeight = this.#canvas.height;

    this.#ctx.lineJoin = 'round';
    this.#ctx.lineCap = 'round';
    // Calculate the radius of the knob
    const radius = Math.min(canvasWidth / 2, canvasHeight / 2) - 30;

    // // Draw the circle for the knob
    // this.#ctx.beginPath();
    // this.#ctx.arc(canvasWidth / 2, canvasHeight / 2, radius, 0, 2 * Math.PI);
    // this.#ctx.strokeStyle = "#333";
    // this.#ctx.fillStyle = "#222";
    // this.#ctx.lineWidth = 5;
    // this.#ctx.stroke();
    // this.#ctx.fill();

    const angleG = this.canvasController.getAngleToLightSource();
    this.#ctx.save(); // Save current state of context

    this.#ctx.translate(canvasWidth / 2, canvasHeight / 2);
    // Rotate context by calculated angle in radians
    this.#ctx.rotate(360 - (-angleG * Math.PI) / 180);
    // Move rotation point to center of canvas
    // this.#ctx.translate(canvasWidth / 2, canvasHeight / 2);

    // Create a new linear gradient with the color stops at 0 and 100%
    const gradient = this.#ctx.createLinearGradient(0, -radius, 0, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3'); // White at the top of circle    (0%)
    gradient.addColorStop(1, 'rgba(0,0,0, .1'); // Black at the bottom of circle    (100%)
    this.#ctx.fillStyle = gradient;

    // Draw the circle for the knob
    this.#ctx.beginPath();
    this.#ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    this.#ctx.closePath();

    const x = 0;
    const y = 0;

    const darkGray = '#333';
    const ligntGray = '#111';
    // Create a radial gradient with multiple colors
    const grd = this.#ctx.createRadialGradient(x, y, 1, x, y, radius);
    grd.addColorStop(0, ligntGray); // #ddd at the center  (0%)
    grd.addColorStop(0.05, darkGray); // #ddd at the center  (0%)
    grd.addColorStop(0.1, ligntGray); // #ddd at the center  (0%)
    grd.addColorStop(0.15, darkGray); // #ddd at the center  (0%)
    grd.addColorStop(0.2, ligntGray); // #ddd at the center  (0%)
    grd.addColorStop(0.25, darkGray); // #ddd at the center  (0%)
    grd.addColorStop(0.3, ligntGray); // #ddd at the center  (0%)
    grd.addColorStop(0.35, darkGray); // #ddd at the center  (0%)
    grd.addColorStop(0.4, ligntGray); // #ddd at the center  (0%)
    grd.addColorStop(0.45, darkGray); // #ddd at the center  (0%)
    grd.addColorStop(0.5, ligntGray); // #ddd at the center  (0%)
    grd.addColorStop(0.55, darkGray); // #ddd at the center  (0%)
    grd.addColorStop(0.6, ligntGray); // #ddd at the center  (0%)
    grd.addColorStop(0.65, darkGray); // #ddd at the center  (0%)
    grd.addColorStop(0.7, ligntGray); // #ddd at the center  (0%)
    grd.addColorStop(0.75, darkGray); // #ddd at the center  (0%)
    grd.addColorStop(0.8, ligntGray); // #ddd at the center  (0%)
    grd.addColorStop(0.85, darkGray); // #ddd at the center  (0%)
    grd.addColorStop(0.9, ligntGray); // #ddd at the center  (0%)
    grd.addColorStop(0.9, darkGray); // #ddd at the center  (0%)
    grd.addColorStop(1, ligntGray); // #ddd at the center  (0%)

    this.#ctx.fillStyle = grd;
    this.#ctx.fill(); // Fill the circle with the current fill style (the gradient)
    this.#ctx.fillStyle = gradient;
    this.#ctx.fill();
    this.#ctx.restore(); // Restore the context state to its original saved state

    // Draw the line that represents the current volume level
    const normalizedAnglePerStepSize =
      (this.value - this.min) / (this.max - this.min);
    const angle = (315 - normalizedAnglePerStepSize * 360) * (Math.PI / 270);
    this.#ctx.beginPath();
    // this.#ctx.moveTo(canvasWidth / 2, canvasHeight / 2);
    this.#ctx.moveTo(
      canvasWidth / 2 + radius * 0.7 * Math.cos(angle),
      canvasHeight / 2 - radius * 0.7 * Math.sin(angle)
    );
    this.#ctx.lineTo(
      canvasWidth / 2 + radius * 0.7 * Math.cos(angle),
      canvasHeight / 2 - radius * 0.7 * Math.sin(angle)
    );

    this.#ctx.strokeStyle = 'orange';
    this.#ctx.lineWidth = 6;
    this.#ctx.stroke();
    this.#ctx.closePath();
    this.#ctx.beginPath();

    for (let i = 315; i > -60; i = i - 20) {
      const newAngle = i * (Math.PI / 270);

      this.#ctx.moveTo(
        canvasWidth / 2 + radius * 1.5 * Math.cos(newAngle),
        canvasHeight / 2 - radius * 1.5 * Math.sin(newAngle)
      );
      const longLines = [315, 235, 135, -45, 35];
      let lineWidth = radius * 1.9;
      if (longLines.includes(i)) {
        lineWidth = radius * 2.2;
      }
      this.#ctx.lineTo(
        canvasWidth / 2 + lineWidth * Math.cos(newAngle),
        canvasHeight / 2 - lineWidth * Math.sin(newAngle)
      );
    }

    this.#ctx.lineWidth = 2;
    this.#ctx.strokeStyle = 'white';
    this.#ctx.stroke();
    this.#ctx.closePath();
  }

  connectedCallback(): void {
    this.canvasController.draw(0, this.drawCanvas.bind(this));
    this.canvasController.resize();

    this.#canvas.addEventListener('mousedown', (event) => {
      this.mousePositionOnMousedown = { x: event.x, y: event.y };
    });
    this.#canvas.addEventListener('mousemove', (event) => {
      if (this.mousePositionOnMousedown == null || this.#ctx === null) {
        return;
      }
      this.drawCanvas();
      this.#ctx.save();
      this.#ctx?.translate(25, 25);
      this.#ctx.lineDashOffset = 8;
      this.#ctx.moveTo(0, 0);
      this.#ctx?.lineTo(
        event.x - this.mousePositionOnMousedown.x,
        event.y - this.mousePositionOnMousedown.y
      );

      this.value = Number(
        Math.min(
          Math.max(
            Number(this.value) -
              (event.y - this.mousePositionOnMousedown.y) * this.stepSize,
            this.min
          ),
          this.max
        ).toFixed(2)
      );

      this.#ctx.lineCap = 'round';
      // this.#ctx.lineWidth = 5;
      this.#ctx?.stroke();
      this.mousePositionOnMousedown = { x: event.x, y: event.y };
      this.#ctx.restore();
    });

    this.#canvas.addEventListener('mouseleave', () => {
      this.mousePositionOnMousedown = undefined;
    });
    this.#canvas.addEventListener('mouseup', () => {
      this.mousePositionOnMousedown = undefined;
    });
  }
}

// Define the new element
customElements.define('csd-range', CsdRange);
