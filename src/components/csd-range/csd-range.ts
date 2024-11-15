import styles from './csd-range.scss?inline';

export class CsdRange extends HTMLElement {
  // rangeDomReference;
  _value: string;
  label: string;
  rangeElement: HTMLInputElement
  inputElement: HTMLOutputElement;
  min: number;
  max: number;
  #canvas: HTMLCanvasElement;
  mousePositionOnMousedown: any;
  #ctx;

  constructor(props: any) {
    super();
    this.#canvas = document.createElement('canvas');
    this.#ctx = this.#canvas.getContext('2d');

    this._value = '0';
    this.min = props.min || .10;
    this.max = props.max || 1;
    this.label = props.label;

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);

    const shadowRoot = this.attachShadow({ mode: 'open' });

    this.rangeElement = this.renderRangeElement();
    this.inputElement = this.renderRangeValueDisplayElement();


    let rangeLabel = document.createElement('label');
    let labelSpan = document.createElement('span');
    labelSpan.classList.add('sr-only');
    labelSpan.innerText = this.label;

    rangeLabel.append(labelSpan, this.rangeElement);


    shadowRoot.adoptedStyleSheets.push(sheet);
    shadowRoot.appendChild(this.#canvas);
    shadowRoot.appendChild(this.inputElement);
    shadowRoot.appendChild(rangeLabel);

    if (props?.value != null) {
      this._value = props.value;
    }

  }

  set value(value: string) {
    this._value = value;
    this.inputElement.value = value;
    this.rangeElement.value = value;

    requestAnimationFrame(() => {
      this.dispatchEvent(new CustomEvent("csdRange", {
        detail: {
          value: this.value,
        }
      }));
    })
    this.drawCanvas();
  }

  get value(): string {
    return this._value;
  }




  renderRangeValueDisplayElement(): HTMLOutputElement {
    let rangeValueInput = document.createElement('output');
    rangeValueInput.setAttribute('type', 'text');
    rangeValueInput.value = this.value;

    rangeValueInput.addEventListener('input', (event) => {
      this.value = (event.target as any).value;
    });

    return rangeValueInput;
  }



  renderRangeElement(): HTMLInputElement {
    let rangeElement = document.createElement('input');

    rangeElement.setAttribute('type', 'range');
    rangeElement.setAttribute('min', String(this.min));
    rangeElement.setAttribute('max', String(this.max));
    rangeElement.setAttribute('step', '0.01')
    rangeElement.value = this.value;

    rangeElement.addEventListener('input', (event) => {
      this.value = (event.target as any).value;
    });

    return rangeElement;
  }

  drawCanvas() {
    if (this.#ctx == null) {
      return;
    }
    // const width = this.#canvas.clientWidth;
    // const height = this.#canvas.clientHeight;

    const canvasWidth = this.#ctx.canvas.width;
    const canvasHeight = this.#ctx.canvas.height;

    this.#canvas.width = 100;
    this.#canvas.height = 100;

    this.#ctx.lineJoin = "round";
    this.#ctx.lineCap = "round"
    // Calculate the radius of the knob
    var radius = Math.min(canvasWidth / 2, canvasHeight / 2) - 30;

    // Draw the circle for the knob
    this.#ctx.beginPath();
    this.#ctx.arc(canvasWidth / 2, canvasHeight / 2, radius, 0, 2 * Math.PI);
    this.#ctx.strokeStyle = '#333';
    this.#ctx.fillStyle = '#222';
    this.#ctx.lineWidth = 5;
    this.#ctx.stroke();
    this.#ctx.fill();
    // Draw the line that represents the current volume level
    var angle = (180 - (Number(this.value) * 180)) * (Math.PI / 180);

    this.#ctx.beginPath();
    this.#ctx.moveTo(canvasWidth / 2, canvasHeight / 2);
    this.#ctx.lineTo(canvasWidth / 2 + radius * Math.cos(angle), canvasHeight / 2 - radius * Math.sin(angle));
    this.#ctx.strokeStyle = 'orange';
    this.#ctx.lineWidth = 4;
    this.#ctx.stroke();
  }

  connectedCallback() {
    this.drawCanvas();
    this.#canvas.addEventListener('mousedown', (event) => {
      this.mousePositionOnMousedown = {x: event.x, y: event.y};
      console.log(this.mousePositionOnMousedown)
    });
    this.#canvas.addEventListener('mousemove', (event) => {
      if (this.mousePositionOnMousedown === null || this.#ctx === null) {
        return;
      }
      this.drawCanvas();
      this.#ctx.save();
      this.#ctx?.translate(25, 25);
      this.#ctx.lineDashOffset = 8
      this.#ctx.moveTo(0, 0);
      console.log((event.x - this.mousePositionOnMousedown.x),  (event.y - this.mousePositionOnMousedown.y))
      this.#ctx?.lineTo((event.x - this.mousePositionOnMousedown.x),  (event.y - this.mousePositionOnMousedown.y));
  


      this.value = String(Math.min(Math.max(Number(this.value) - (event.y - this.mousePositionOnMousedown.y) / 100, 0), 1).toFixed(2) )

      this.#ctx.lineCap = 'round';
      // this.#ctx.lineWidth = 5;
      this.#ctx?.stroke();
      console.log(event)
      this.mousePositionOnMousedown = {x: event.x, y: event.y}
      this.#ctx.restore();
    });

    this.#canvas.addEventListener('mouseup', () => {
      this.mousePositionOnMousedown = null;
    })

  }
}

// Define the new element
customElements.define('csd-range', CsdRange);