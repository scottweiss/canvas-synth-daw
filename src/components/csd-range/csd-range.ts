import styles from './csd-range.scss?inline';

export class CsdRange extends HTMLElement {
  // rangeDomReference;
  _value: string;
  label: string;
  rangeElement: HTMLInputElement
  inputElement: HTMLOutputElement;
  min: number;
  max: number;

    constructor(props: any) {
      super();

      this._value = '0';
      this.min = props.min || .10;
      this.max = props.max || 1;
      this.label = props.label;

      const sheet = new CSSStyleSheet();
      sheet.replaceSync(styles);

      const shadowRoot = this.attachShadow({mode: 'open'});

      this.rangeElement = this.renderRangeElement();
      this.inputElement= this.renderRangeValueDisplayElement();


      let rangeLabel = document.createElement('label');
      let labelSpan = document.createElement('span');
      labelSpan.classList.add('sr-only');
      labelSpan.innerText = this.label;

      rangeLabel.append(labelSpan, this.rangeElement);


      shadowRoot.adoptedStyleSheets.push(sheet);
      shadowRoot.appendChild(this.inputElement);
      shadowRoot.appendChild(rangeLabel);

      if (props?.value != null) {
        this._value = props.value;
      }
    }

    set value(value: string){
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


}

// Define the new element
customElements.define('csd-range', CsdRange);